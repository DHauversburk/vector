import { supabase } from '../../supabase';
import type { Appointment } from '../types';
import type { IAppointmentActions } from '../interfaces';
import { logger } from '../../logger';

export const supabaseAppointments: IAppointmentActions = {
    getMyAppointments: async (startDate?: string, endDate?: string): Promise<Appointment[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        let query = supabase
            .from('appointments')
            .select('*, provider:users!provider_id(token_alias, service_type)')
            .eq('member_id', user.id);

        if (startDate) query = query.gte('start_time', startDate);
        if (endDate) query = query.lte('start_time', endDate);

        const { data, error } = await query.order('start_time', { ascending: true });
        if (error) throw error;
        return (data || []) as Appointment[];
    },

    bookSlot: async (slotId: string, notes?: string): Promise<Appointment> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: existingSlot } = await supabase
            .from('appointments')
            .select('notes')
            .eq('id', slotId)
            .single();

        let finalNotes = notes || null;
        if (existingSlot?.notes && existingSlot.notes.includes('Location:')) {
            const locParts = existingSlot.notes.split('|').map((s: string) => s.trim());
            const loc = locParts.find((s: string) => s.startsWith('Location:'));
            if (loc) {
                finalNotes = notes ? `${notes} | ${loc}` : loc;
            } else if (existingSlot.notes.trim().startsWith('Location:')) {
                finalNotes = notes ? `${notes} | ${existingSlot.notes.trim()}` : existingSlot.notes.trim();
            }
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({
                member_id: user.id,
                is_booked: true,
                status: 'confirmed',
                notes: finalNotes
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    deleteAppointment: async (appointmentId: string): Promise<void> => {
        const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
        if (error) throw error;
    },

    cancelAppointment: async (appointmentId: string, reason?: string): Promise<void> => {
        const { error } = await supabase.rpc('member_cancel_appointment', {
            p_appointment_id: appointmentId
        });

        if (error) throw error;

        if (reason) {
            try {
                const { data } = await supabase.from('appointments').select('notes').eq('id', appointmentId).single();
                const newNotes = (data?.notes || '') + ` | CANCEL_REASON: ${reason}`;
                await supabase.from('appointments').update({ notes: newNotes }).eq('id', appointmentId);
            } catch (e) {
                logger.warn('supabase', 'Could not save cancel reason', e);
            }
        }
    },

    providerCancelAppointment: async (appointmentId: string, reason: string): Promise<void> => {
        const { data: current } = await supabase.from('appointments').select('notes').eq('id', appointmentId).single();
        const newNotes = (current?.notes || '') + ` | CANCEL_REASON: ${reason}`;

        const { error } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                notes: newNotes,
                is_booked: false
            })
            .eq('id', appointmentId);

        if (error) throw error;
    },

    directBook: async (slotId: string, memberId: string): Promise<Appointment> => {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                member_id: memberId,
                is_booked: true,
                status: 'confirmed'
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    submitFeedback: async (appointmentId: string, rating: number, comment?: string): Promise<{ success: boolean }> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('feedback')
            .insert({
                appointment_id: appointmentId,
                rating,
                comment: comment || null,
                created_at: new Date().toISOString(),
            });

        if (error) throw error;
        return { success: true };
    },

    rescheduleAppointmentSwap: async (oldApptId: string, newSlotId: string): Promise<boolean> => {
        const { error } = await supabase.rpc('reschedule_appointment_swap', {
            p_old_appointment_id: oldApptId,
            p_new_slot_id: newSlotId
        });

        if (error) throw error;
        return true;
    },

    updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    getAllAppointments: async (): Promise<Appointment[]> => {
        const { data, error } = await supabase
            .from('appointments')
            .select('*, provider:users!provider_id(token_alias, service_type), member:users!member_id(token_alias)')
            .order('start_time', { ascending: false });

        if (error) throw error;
        return (data || []) as Appointment[];
    },

    checkAvailability: async (date: Date): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return true;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', user.id)
            .neq('status', 'cancelled')
            .gte('start_time', start.toISOString())
            .lte('start_time', end.toISOString());

        if (error) throw error;
        return (count || 0) === 0;
    },

    createAppointment: async (appt: Omit<Appointment, 'id' | 'created_at' | 'provider' | 'member'>): Promise<Appointment> => {
        const { data, error } = await supabase
            .from('appointments')
            .insert({ ...appt, is_booked: true })
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    }
};
