import { mockInteractions } from './mock';
import type { IInteractionActions } from '../interfaces';

// For now, interactions are mostly handled by the mock store 
// as the corresponding tables (encounter_notes, help_requests, waitlist) 
// are not yet fully provisioned in the public schema.
export const supabaseInteractions: IInteractionActions = mockInteractions;
