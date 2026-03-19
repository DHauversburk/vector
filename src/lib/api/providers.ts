import { IS_MOCK } from '../supabase';
import { supabaseProviders } from './providers/supabase';
import { mockProviders } from './providers/mock';
import type { IProviderActions } from './interfaces';

export const providerActions: IProviderActions = IS_MOCK ? mockProviders : supabaseProviders;
