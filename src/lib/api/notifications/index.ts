import { IS_MOCK } from '../../supabase'
import { mockNotifications } from './mock'
import { supabaseNotifications } from './supabase'

export const notificationActions = IS_MOCK ? mockNotifications : supabaseNotifications
