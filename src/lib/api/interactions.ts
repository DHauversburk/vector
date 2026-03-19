import { IS_MOCK } from '../supabase';
import { supabaseInteractions } from './interactions/supabase';
import { mockInteractions } from './interactions/mock';
import type { IInteractionActions } from './interfaces';

export const interactionActions: IInteractionActions = IS_MOCK ? mockInteractions : supabaseInteractions;
