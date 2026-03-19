import { supabase } from '../../supabase';
import type { Appointment, ProviderResource, ProviderProfile, Feedback, NoteStatistics } from '../types';
import { interactionActions } from '../interactions';
import type { IProviderActions } from '../interfaces';

export const supabaseProviders: IProviderActions = {
    getProviders: async (): Promise<ProviderProfile[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('id, token_alias, role, service_type')
            .eq('role', 'provider');

        if (error) throw error;
        return data as ProviderProfile[];
    },

    getProviderOpenSlots: async (providerId: string, startDate?: string): Promise<Appointment[]> => {
        let query = supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', providerId)
            .is('member_id', null)
            .eq('is_booked', false);

        const minStartTime = new Date(Date.now() + 30 * 60000).toISOString();
        query = query.gte('start_time', minStartTime);
        if (startDate) query = query.gte('start_time', startDate);

        const { data, error } = await query.order('start_time', { ascending: true });
        if (error) throw error;
        return (data || []) as Appointment[];
    },

    getProviderSchedule: async (providerId: string, startDate: string, endDate: string): Promise<Appointment[]> => {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', providerId)
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data as Appointment[];
    },

    generateSlots: async (startDate: string, endDate: string, startTime: string, endTime: string, duration: number, breakMinutes: number, days: number[], isBlock: boolean = false, notes: string | null = null): Promise<unknown> => {
        const { data, error } = await supabase.rpc('generate_slots', {
            p_start_date: startDate,
            p_end_date: endDate,
            p_start_time: startTime,
            p_end_time: endTime,
            p_duration_minutes: duration,
            p_break_minutes: breakMinutes,
            p_days_of_week: days,
            p_is_block: isBlock,
            p_notes: notes || undefined,
            p_timezone_offset_minutes: new Date().getTimezoneOffset()
        });

        if (error) throw error;
        return data;
    },

    clearSchedule: async (startDate: string, endDate: string, includeBooked: boolean = false): Promise<{ count?: number; deleted?: number; success?: boolean; method?: string }> => {
        try {
            const { data, error } = await supabase.rpc('clear_provider_schedule', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_include_booked: includeBooked
            });
            if (error) throw error;
            return { count: data, deleted: data, success: true, method: 'rpc' };
        } catch (e) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");
            let query = supabase.from('appointments')
                .delete()
                .eq('provider_id', user.id)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (!includeBooked) query = query.is('member_id', null);
            const { data, error } = await query.select();
            if (error) throw e;
            return { success: true, deleted: data?.length || 0, method: 'client-fallback' };
        }
    },

    toggleSlotBlock: async (slotId: string, isBlocked: boolean, notes: string | null = null): Promise<Appointment> => {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                is_booked: isBlocked,
                status: isBlocked ? 'blocked' : 'pending',
                notes: notes
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    getAnalytics: async (): Promise<{ appointments: Appointment[]; feedback: Feedback[]; noteStats: NoteStatistics[] }> => {
        const noteStats = await interactionActions.getNoteStatistics(6);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', user.id)
            .order('start_time', { ascending: false });
        if (aptError) throw aptError;
        const { data: feedback, error: fbError } = await supabase
            .from('feedback')
            .select('*')
            .in('appointment_id', (appointments || []).map((a) => a.id));
        return { appointments: (appointments as unknown as Appointment[]) || [], feedback: fbError ? [] : ((feedback as unknown as Feedback[]) || []), noteStats };
    },

    getProviderResources: async (providerId: string): Promise<ProviderResource[]> => {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ProviderResource[];
    },

    getMyResources: async (): Promise<ProviderResource[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ProviderResource[];
    },

    addResource: async (resource: Omit<ProviderResource, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderResource> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await supabase
            .from('resources')
            .insert([{ provider_id: user.id, ...resource }])
            .select()
            .single();
        if (error) throw error;
        return data as ProviderResource;
    },

    updateResource: async (id: string, updates: Partial<ProviderResource>): Promise<ProviderResource | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await supabase
            .from('resources')
            .update(updates)
            .eq('id', id)
            .eq('provider_id', user.id)
            .select()
            .single();
        if (error) throw error;
        return data as ProviderResource;
    },

    deleteResource: async (id: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { error } = await supabase.from('resources').delete().eq('id', id).eq('provider_id', user.id);
        if (error) throw error;
        return true;
    },

    getAvailableResources: async (): Promise<{ provider: string, resources: ProviderResource[] }[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data: appointments, error: aptError } = await supabase.from('appointments').select('provider_id').eq('member_id', user.id);
        if (aptError) throw aptError;
        const providerIds = [...new Set((appointments || []).map((a: { provider_id: string }) => a.provider_id))] as string[];
        if (providerIds.length === 0) return [];
        const { data: resources, error: resError } = await supabase.from('resources').select('*').in('provider_id', providerIds).order('created_at', { ascending: false });
        if (resError) throw resError;
        return providerIds.map((pid) => ({
            provider: pid,
            resources: ((resources || []) as unknown as ProviderResource[]).filter((r) => r.provider_id === pid)
        })).filter(g => g.resources.length > 0);
    }
};
