import { mockStore } from '../mockStore';
import type { PublicUser, AuditLog, SystemStats } from '../types';
import type { IAdminActions } from '../interfaces';

export const mockAdmin: IAdminActions = {
    getMembers: async (search?: string): Promise<PublicUser[]> => {
        const mockMembers = [
            { id: 'mock-user-8821', token_alias: 'PATIENT ALPHA', role: 'member', status: 'active', created_at: new Date().toISOString() },
            { id: 'mock-user-3392', token_alias: 'PATIENT BRAVO', role: 'member', status: 'active', created_at: new Date().toISOString() },
            { id: 'mock-user-1102', token_alias: 'PATIENT CHARLIE', role: 'member', status: 'active', created_at: new Date().toISOString() }
        ];
        if (search) {
            return mockMembers.filter(m => m.token_alias.includes(search.toUpperCase()) || m.id.includes(search)) as PublicUser[];
        }
        return mockMembers as PublicUser[];
    },

    updateUser: async (id: string, updates: Partial<PublicUser>): Promise<PublicUser> => {
        console.log('[MOCK] Update user', id, updates);
        return { id, ...updates } as PublicUser;
    },

    adminResetUserSecurity: async (userId: string): Promise<boolean> => {
        localStorage.removeItem(`TACTICAL_PIN_${userId}`);
        return true;
    },

    resetMockData: async (): Promise<boolean> => {
        mockStore.reset();
        return true;
    },

    fixDuplicateUsers: async (): Promise<number> => {
        return 0;
    },

    logEvent: async (type: string, description: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO', metadata: Record<string, unknown> = {}): Promise<void> => {
        console.log(`[MOCK AUDIT] [${severity}] ${type}: ${description}`, metadata);
    },

    getAuditLogs: async (_filters: { type?: string; severity?: string, limit?: number } = {}): Promise<AuditLog[]> => {
        return [];
    },

    getSystemStats: async (): Promise<SystemStats> => {
        mockStore.load();
        const activeAppts = mockStore.appointments.filter(a =>
            a.status !== 'cancelled' && new Date(a.start_time) > new Date()
        ).length;
        return {
            total_users: 25,
            active_appointments: activeAppts,
            available_slots: 42,
            errors_today: 0,
            duplicates: 0
        };
    },

    adminCreateUser: async (email: string, _pass: string, token: string, _role: string, _serviceType: string): Promise<string> => {
        console.log('[MOCK] Created user:', { email, token });
        return 'mock-user-id-' + Math.random();
    },

    provisionMember: async (_token: string, _serviceType: string): Promise<string> => {
        return 'mock-id-' + Math.random();
    },

    pruneInactiveUsers: async (_days: number): Promise<number> => {
        return Math.floor(Math.random() * 10);
    },

    adminDeleteUser: async (userId: string): Promise<void> => {
        console.log('[MOCK] Delete user', userId);
    }
};
