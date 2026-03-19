import { IS_MOCK } from '../supabase';
import { supabaseAuth } from './auth/supabase';
import { mockAuth } from './auth/mock';
import type { IAuthActions } from './interfaces';

export const authActions: IAuthActions = IS_MOCK ? mockAuth : supabaseAuth;
