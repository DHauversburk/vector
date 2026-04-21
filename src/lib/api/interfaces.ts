import type {
  Appointment,
  ProviderResource,
  Feedback,
  NoteStatistics,
  PublicUser,
  AuditLog,
  SystemStats,
  EncounterNote,
  HelpRequest,
  WaitlistEntry,
  ProviderProfile,
  MFAFactor,
} from './types'

export type { MFAFactor }

export interface IAppointmentActions {
  getMyAppointments(startDate?: string, endDate?: string): Promise<Appointment[]>
  bookSlot(slotId: string, notes?: string): Promise<Appointment>
  deleteAppointment(appointmentId: string): Promise<void>
  cancelAppointment(appointmentId: string, reason?: string): Promise<void>
  providerCancelAppointment(appointmentId: string, reason: string): Promise<void>
  directBook(slotId: string, memberId: string): Promise<Appointment>
  submitFeedback(
    appointmentId: string,
    rating: number,
    comment?: string,
  ): Promise<{ success: boolean }>
  rescheduleAppointmentSwap(oldApptId: string, newSlotId: string): Promise<boolean>
  updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment>
  getAllAppointments(): Promise<Appointment[]>
  checkAvailability(date: Date): Promise<boolean>
  createAppointment(
    appt: Omit<Appointment, 'id' | 'created_at' | 'provider' | 'member'>,
  ): Promise<Appointment>
}

export interface IProviderActions {
  getProviders(): Promise<ProviderProfile[]>
  getProviderOpenSlots(providerId: string, startDate?: string): Promise<Appointment[]>
  getProviderSchedule(
    providerId: string,
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]>
  generateSlots(
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
    duration: number,
    breakMinutes: number,
    days: number[],
    isBlock?: boolean,
    notes?: string | null,
  ): Promise<unknown>
  clearSchedule(
    startDate: string,
    endDate: string,
    includeBooked?: boolean,
  ): Promise<{ count?: number; deleted?: number; success?: boolean; method?: string }>
  toggleSlotBlock(slotId: string, isBlocked: boolean, notes?: string | null): Promise<Appointment>
  getAnalytics(): Promise<{
    appointments: Appointment[]
    feedback: Feedback[]
    noteStats: NoteStatistics[]
  }>
  getProviderResources(providerId: string): Promise<ProviderResource[]>
  getMyResources(): Promise<ProviderResource[]>
  addResource(
    resource: Omit<ProviderResource, 'id' | 'provider_id' | 'created_at'>,
  ): Promise<ProviderResource>
  updateResource(id: string, updates: Partial<ProviderResource>): Promise<ProviderResource | null>
  deleteResource(id: string): Promise<boolean>
  getAvailableResources(): Promise<{ provider: string; resources: ProviderResource[] }[]>
}

export interface IAdminActions {
  getMembers(search?: string): Promise<PublicUser[]>
  updateUser(id: string, updates: Partial<PublicUser>): Promise<PublicUser>
  adminResetUserSecurity(userId: string): Promise<boolean>
  resetMockData(): Promise<boolean>
  fixDuplicateUsers(): Promise<number>
  logEvent(
    type: string,
    description: string,
    severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    metadata?: Record<string, unknown>,
  ): Promise<void>
  getAuditLogs(filters?: { type?: string; severity?: string; limit?: number }): Promise<AuditLog[]>
  getSystemStats(): Promise<SystemStats>
  adminCreateUser(
    email: string,
    pass: string,
    token: string,
    role: string,
    serviceType: string,
  ): Promise<string>
  provisionMember(token: string, serviceType: string): Promise<string>
  pruneInactiveUsers(days: number): Promise<number>
  adminDeleteUser(userId: string): Promise<void>
}

export interface IAuthActions {
  setTacticalPin(userId: string, pin: string): Promise<void>
  getTacticalPin(userId: string): Promise<string | null>
  verifyTacticalPin(userId: string, pin: string): Promise<boolean>
  /** Self-service credential management — available to all authenticated users */
  updatePassword(newPassword: string): Promise<void>
  updateEmail(newEmail: string): Promise<void>
  enrollMFA(): Promise<{ qrCode: string; secret: string; factorId: string }>
  verifyMFA(factorId: string, code: string): Promise<void>
  unenrollMFA(factorId: string): Promise<void>
  listMFAFactors(): Promise<MFAFactor[]>
  signOutOtherSessions(): Promise<void>
}

export interface IInteractionActions {
  addEncounterNote(
    note: Omit<EncounterNote, 'id' | 'created_at'> & { id?: string },
  ): Promise<EncounterNote>
  getNoteStatistics(months?: number): Promise<NoteStatistics[]>
  getProviderEncounterNotes(limit?: number, includeArchived?: boolean): Promise<EncounterNote[]>
  archiveNote(noteId: string): Promise<EncounterNote | null>
  unarchiveNote(noteId: string): Promise<EncounterNote | null>
  updateNoteStatus(noteId: string, status: EncounterNote['status']): Promise<EncounterNote | null>
  getMemberEncounterNotes(memberId: string): Promise<EncounterNote[]>
  linkNoteToFollowUp(noteId: string, appointmentId: string): Promise<EncounterNote | null>
  updateNote(noteId: string, updates: Partial<EncounterNote>): Promise<EncounterNote | null>
  bulkArchiveNotes(
    beforeDate: string,
    providerId?: string,
  ): Promise<{ archivedCount: number; notes: EncounterNote[] }>
  createHelpRequest(
    request: Omit<HelpRequest, 'id' | 'member_id' | 'status' | 'created_at'> & { id?: string },
  ): Promise<HelpRequest>
  getMyHelpRequests(): Promise<HelpRequest[]>
  getPendingHelpRequests(): Promise<HelpRequest[]>
  updateHelpRequestStatus(
    requestId: string,
    status: HelpRequest['status'],
  ): Promise<HelpRequest | null>
  resolveHelpRequest(requestId: string, resolutionNote: string): Promise<HelpRequest | null>
  getPendingHelpRequestCount(): Promise<number>
  joinWaitlist(
    providerId: string,
    serviceType: string,
    note?: string,
    preferredDays?: number[],
  ): Promise<WaitlistEntry>
  leaveWaitlist(entryId: string): Promise<void>
  getMyWaitlist(): Promise<WaitlistEntry[]>
  getProviderWaitlist(providerId: string): Promise<WaitlistEntry[]>
}
