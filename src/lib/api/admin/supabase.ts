import { supabase } from '../../supabase';
import type { PublicUser, AuditLog, SystemStats, Json } from '../types';
import type { IAdminActions } from '../interfaces';
import { logger } from '../../logger';

export const supabaseAdmin: IAdminActions = {
    getMembers: async (search?: string): Promise<PublicUser[]> => {
        let query = supabase.from('users').select('*, appointments!member_id(count)').eq('role', 'member');
        if (search) {
            query = query.or(`token_alias.ilike.%${search}%,id.eq.${search}`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as PublicUser[];
    },

    updateUser: async (id: string, updates: Partial<PublicUser>): Promise<PublicUser> => {
        const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as PublicUser;
    },

    adminResetUserSecurity: async (userId: string): Promise<boolean> => {
        // Delete from server-side user_pins table
        const { error } = await supabase
            .from('user_pins')
            .delete()
            .eq('user_id', userId);

        // Also clear any local fallback
        localStorage.removeItem(`TACTICAL_PIN_${userId}`);

        if (error) {
            console.warn('Failed to reset user PIN in Supabase:', error);
        }
        return true;
    },

    resetMockData: async (): Promise<boolean> => {
        return false;
    },

    fixDuplicateUsers: async (): Promise<number> => {
        const { data, error } = await supabase.rpc('fix_duplicate_users');
        if (error) throw error;
        return data as number;
    },

    logEvent: async (type: string, description: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO', metadata: Record<string, unknown> = {}): Promise<void> => {
        try {
            await supabase.rpc('log_event', {
                p_action_type: type,
                p_description: description,
                p_severity: severity,
                p_metadata: metadata as unknown as Json
            });
        } catch (e) {
            logger.error('supabase', 'Failed to log event:', e);
        }
    },

    getAuditLogs: async (filters: { type?: string; severity?: string, limit?: number } = {}): Promise<AuditLog[]> => {
        const { data, error } = await supabase.rpc('get_audit_logs', {
            p_limit: filters.limit || 50,
            p_type: filters.type || '',
            p_severity: filters.severity || ''
        });
        if (error) throw error;
        return (data || []) as AuditLog[];
    },

    getSystemStats: async (): Promise<SystemStats> => {
        const { data, error } = await supabase.rpc('get_system_stats');
        if (error) {
            logger.warn('supabase', "get_system_stats RPC failed or missing", error);
            return {
                total_users: 0,
                active_appointments: 0,
                available_slots: 0,
                errors_today: 0,
                duplicates: 0
            };
        }
        return data as unknown as SystemStats;
    },

    adminCreateUser: async (email: string, pass: string, token: string, role: string, serviceType: string): Promise<string> => {
        const { data: userId, error } = await supabase.rpc('admin_create_user', {
            new_email: email,
            new_password: pass,
            new_token: token,
            new_role: role,
            new_service_type: serviceType || ''
        });

        if (error) throw error;
        return userId as string;
    },

    provisionMember: async (token: string, serviceType: string): Promise<string> => {
        const { data, error } = await supabase.rpc('provision_member', {
            p_token: token,
            p_service_type: serviceType
        });
        if (error) throw error;
        return data as string;
    },

    pruneInactiveUsers: async (days: number): Promise<number> => {
        const { data, error } = await supabase.rpc('admin_prune_unused_accounts', { days_inactive: days });
        if (error) throw error;
        return data as number;
    },

    adminDeleteUser: async (userId: string): Promise<void> => {
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
        if (error) throw error;
    }
};
