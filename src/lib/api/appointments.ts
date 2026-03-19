import { IS_MOCK } from '../supabase';
import { supabaseAppointments } from './appointments/supabase';
import { mockAppointments } from './appointments/mock';
import type { IAppointmentActions } from './interfaces';

export const appointmentActions: IAppointmentActions = IS_MOCK ? mockAppointments : supabaseAppointments;
