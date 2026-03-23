import { mockStore } from '../mockStore';
import type { Appointment, ProviderResource, ProviderProfile, Feedback, NoteStatistics } from '../types';
import { interactionActions } from '../interactions';
import type { IProviderActions } from '../interfaces';
import { format } from 'date-fns';
import { supabase } from '../../supabase';

export const mockProviders: IProviderActions = {
    getProviders: async (): Promise<ProviderProfile[]> => {
        return [
            { id: 'mock-provider-jameson', token_alias: 'Dr. Jameson', role: 'provider', service_type: 'MH_GREEN' },
            { id: 'mock-provider-smith', token_alias: 'Dr. Smith', role: 'provider', service_type: 'PRIMARY_BLUE' },
            { id: 'mock-provider-taylor', token_alias: 'Dr. Taylor', role: 'provider', service_type: 'PT_GOLD' }
        ];
    },

    getProviderOpenSlots: async (providerId: string, startDate?: string): Promise<Appointment[]> => {
        await mockStore.load();
        const minTime = startDate ? new Date(startDate).getTime() : Date.now();
        const openSlots = mockStore.appointments.filter(a => {
            const t = new Date(a.start_time).getTime();
            return (
                a.provider_id === providerId &&
                a.status === 'pending' &&
                a.member_id === null &&
                t >= minTime
            );
        });
        openSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return openSlots.slice(0, 50);
    },

    getProviderSchedule: async (providerId: string, startDate: string, endDate: string): Promise<Appointment[]> => {
        await mockStore.load();
        return mockStore.appointments
            .filter(a => a.provider_id === providerId && a.start_time >= startDate && a.start_time <= endDate)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    },

    generateSlots: async (startDate: string, endDate: string, startTime: string, endTime: string, duration: number, breakMinutes: number, days: number[], isBlock: boolean = false, notes: string | null = null): Promise<unknown> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await mockStore.load();
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const startD = new Date(sYear, sMonth - 1, sDay);
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        const endD = new Date(eYear, eMonth - 1, eDay);

        const addDays = (d: Date, dCount: number) => {
            const newDate = new Date(d);
            newDate.setDate(d.getDate() + dCount);
            return newDate;
        };

        for (let d = new Date(startD); d <= endD; d = addDays(d, 1)) {
            if (days.includes(d.getDay())) {
                const [sH, sM] = startTime.split(':').map(Number);
                let currentSlotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sH, sM, 0, 0);
                const [eH, eM] = endTime.split(':').map(Number);
                const currentDayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eH, eM, 0, 0);

                while (currentSlotStart.getTime() < currentDayEnd.getTime()) {
                    const currentSlotEnd = isBlock ? new Date(currentDayEnd) : new Date(currentSlotStart.getTime() + (duration * 60000));
                    if (currentSlotEnd > currentDayEnd) break;

                    const overlappingIndices = mockStore.appointments
                        .map((a, i) => {
                            const aStart = new Date(a.start_time).getTime();
                            const aEnd = new Date(a.end_time).getTime();
                            const bStart = currentSlotStart.getTime();
                            const bEnd = currentSlotEnd.getTime();
                            return (aStart < bEnd && aEnd > bStart && a.provider_id === user.id) ? i : -1;
                        })
                        .filter(i => i !== -1)
                        .sort((a, b) => b - a);

                    if (overlappingIndices.length > 0) {
                        if (isBlock) {
                            overlappingIndices.forEach(idx => {
                                if (mockStore.appointments[idx].status === 'pending') {
                                    mockStore.appointments.splice(idx, 1);
                                }
                            });
                        } else {
                            currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                            continue;
                        }
                    }

                    const isVideo = !isBlock && Math.random() < 0.3;
                    mockStore.appointments.push({
                        id: `mock-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        provider_id: user.id,
                        member_id: null,
                        start_time: format(currentSlotStart, "yyyy-MM-dd'T'HH:mm:ss"),
                        end_time: format(currentSlotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
                        status: isBlock ? 'blocked' : 'pending',
                        is_booked: isBlock,
                        is_video: isVideo,
                        notes: notes || (isVideo ? 'Telehealth Available' : undefined),
                        created_at: new Date().toISOString()
                    });
                    currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                }
            }
        }
        await mockStore.save();
        return true;
    },

    clearSchedule: async (startDate: string, endDate: string, includeBooked: boolean = false): Promise<{ count?: number; deleted?: number; success?: boolean; method?: string }> => {
        await mockStore.load();
        const initialCount = mockStore.appointments.length;
        mockStore.appointments = mockStore.appointments.filter(a => {
            if (a.start_time < startDate || a.start_time > endDate) return true;
            if (a.member_id) return !includeBooked;
            return false;
        });
        await mockStore.save();
        return { count: initialCount - mockStore.appointments.length };
    },

    toggleSlotBlock: async (slotId: string, isBlocked: boolean, notes: string | null = null): Promise<Appointment> => {
        await mockStore.load();
        if (slotId.startsWith('mock-')) {
            if (isBlocked) {
                const { data: { user } } = await supabase.auth.getUser();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                const idxStr = slotId.split('-').pop() || '0';
                const idx = isNaN(parseInt(idxStr)) ? 0 : parseInt(idxStr);
                const slotTime = new Date(tomorrow);
                slotTime.setHours(9 + idx);

                const blockedAppt: Appointment = {
                    id: `mock-blocked-${Date.now()}`,
                    provider_id: user?.id || 'mock-provider-jameson',
                    member_id: null,
                    start_time: slotTime.toISOString(),
                    end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
                    status: 'blocked',
                    is_booked: true,
                    notes: notes || 'Sick Leave / Admin Block',
                    created_at: new Date().toISOString()
                };
                mockStore.appointments.push(blockedAppt);
                await mockStore.save();
                return blockedAppt;
            }
        }
        
        const idx = mockStore.appointments.findIndex(a => a.id === slotId);
        if (idx >= 0) {
            mockStore.appointments[idx].is_booked = isBlocked;
            mockStore.appointments[idx].status = isBlocked ? 'blocked' : 'pending';
            mockStore.appointments[idx].notes = notes;
            await mockStore.save();
            return mockStore.appointments[idx];
        }
        throw new Error('Slot Not Found');
    },

    getAnalytics: async (): Promise<{ appointments: Appointment[]; feedback: Feedback[]; noteStats: NoteStatistics[] }> => {
        const noteStats = await interactionActions.getNoteStatistics(6);
        await mockStore.load();
        return { appointments: mockStore.appointments, feedback: [], noteStats };
    },

    getProviderResources: async (providerId: string): Promise<ProviderResource[]> => {
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        return allResources.filter(r => r.provider_id === providerId);
    },

    getMyResources: async (): Promise<ProviderResource[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        return allResources.filter(r => r.provider_id === user.id);
    },

    addResource: async (resource: Omit<ProviderResource, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderResource> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const newResource: ProviderResource = {
            id: `resource-${Date.now()}`,
            provider_id: user.id,
            ...resource,
            created_at: new Date().toISOString()
        };
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        allResources.push(newResource);
        localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(allResources));
        return newResource;
    },

    updateResource: async (id: string, updates: Partial<ProviderResource>): Promise<ProviderResource | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        const index = allResources.findIndex(r => r.id === id && r.provider_id === user.id);
        if (index === -1) return null;
        allResources[index] = { ...allResources[index], ...updates } as ProviderResource;
        localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(allResources));
        return allResources[index];
    },

    deleteResource: async (id: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        const filtered = allResources.filter(r => !(r.id === id && r.provider_id === user.id));
        if (filtered.length === allResources.length) return false;
        localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(filtered));
        return true;
    },

    getAvailableResources: async (): Promise<{ provider: string, resources: ProviderResource[] }[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        await mockStore.load();
        const appointments = mockStore.appointments.filter(a => a.member_id === user.id);
        const providerIds = [...new Set(appointments.map(a => a.provider_id))];
        const stored = localStorage.getItem('PROVIDER_RESOURCES');
        const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
        return providerIds.map(pid => ({
            provider: pid,
            resources: allResources.filter(r => r.provider_id === pid)
        })).filter(g => g.resources.length > 0);
    }
};
