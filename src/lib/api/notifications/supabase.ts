import { supabase } from '../../supabase'
import type { Notification } from '../types'
import type { INotificationActions } from '../interfaces'

// TODO(migration): add `notifications` table to Supabase schema and regenerate
// database.types.ts so these casts can be removed. Schema:
//   id uuid PK, user_id uuid FK users, type text, title text, body text,
//   read boolean default false, metadata jsonb, created_at timestamptz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notifs = () => (supabase as any).from('notifications')

export const supabaseNotifications: INotificationActions = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await notifs()
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data || []) as Notification[]
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    const { error } = await notifs().update({ read: true }).eq('id', notificationId)
    if (error) throw error
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    const { error } = await notifs().update({ read: true }).eq('user_id', userId).eq('read', false)
    if (error) throw error
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await notifs()
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
    return count ?? 0
  },
}
