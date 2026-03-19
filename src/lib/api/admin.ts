import { IS_MOCK } from '../supabase';
import { supabaseAdmin } from './admin/supabase';
import { mockAdmin } from './admin/mock';
import type { IAdminActions } from './interfaces';

export const adminActions: IAdminActions = IS_MOCK ? mockAdmin : supabaseAdmin;
