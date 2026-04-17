import { supabase } from '../../supabase'
import type { EncounterNote, HelpRequest, WaitlistEntry, NoteStatistics } from '../types'
import type { IInteractionActions } from '../interfaces'

/**
 * Supabase implementation of IInteractionActions.
 * Reads/writes from encounter_notes, help_requests, and waitlist tables.
 */
export const supabaseInteractions: IInteractionActions = {
  addEncounterNote: async (note) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('encounter_notes')
      .insert({
        provider_id: user.id,
        member_id: note.member_id,
        member_name: note.member_name,
        category: note.category,
        content: note.content,
        status: note.status || 'active',
        resolved: false,
        archived: note.archived || false,
      })
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  getNoteStatistics: async (months: number = 6): Promise<NoteStatistics[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Optimized backend fetch from aggregate table
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    const periodCutoff = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('note_statistics')
      .select('*')
      .eq('provider_id', user.id)
      .gte('period', periodCutoff)
      .order('period', { ascending: false })

    if (error) throw error

    // Ensure types match front-end expectation
    return (data || []).map((stats) => ({
      period: stats.period,
      provider_id: stats.provider_id,
      total_encounters: stats.total_encounters,
      by_category: stats.by_category,
      unique_patients: stats.unique_patients,
      requires_action_count: stats.requires_action_count,
      created_at: stats.created_at,
    })) as NoteStatistics[]
  },

  getProviderEncounterNotes: async (
    limit: number = 50,
    includeArchived: boolean = false,
  ): Promise<EncounterNote[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('encounter_notes')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as EncounterNote[]
  },

  archiveNote: async (noteId: string) => {
    const { data, error } = await supabase
      .from('encounter_notes')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  unarchiveNote: async (noteId: string) => {
    const { data, error } = await supabase
      .from('encounter_notes')
      .update({ archived: false, archived_at: null, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  updateNoteStatus: async (noteId: string, status: EncounterNote['status']) => {
    const { data, error } = await supabase
      .from('encounter_notes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  getMemberEncounterNotes: async (memberId: string) => {
    const { data, error } = await supabase
      .from('encounter_notes')
      .select('*')
      .eq('member_id', memberId)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as EncounterNote[]
  },

  linkNoteToFollowUp: async (noteId: string, appointmentId: string) => {
    const { data, error } = await supabase
      .from('encounter_notes')
      .update({ follow_up_appointment_id: appointmentId, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  updateNote: async (noteId: string, updates: Partial<EncounterNote>) => {
    const { id: _id, created_at: _ca, ...safeUpdates } = updates as any
    const { data, error } = await supabase
      .from('encounter_notes')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as EncounterNote
  },

  bulkArchiveNotes: async (beforeDate: string, providerId?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const pid = providerId || user.id
    const now = new Date().toISOString()

    // Fetch matching notes
    const { data: notes, error: fetchError } = await supabase
      .from('encounter_notes')
      .select('*')
      .eq('provider_id', pid)
      .eq('archived', false)
      .lt('created_at', beforeDate)

    if (fetchError) throw fetchError
    if (!notes || notes.length === 0) return { archivedCount: 0, notes: [] }

    const ids = notes.map((n) => n.id)
    const { error: updateError } = await supabase
      .from('encounter_notes')
      .update({ archived: true, archived_at: now, updated_at: now })
      .in('id', ids)

    if (updateError) throw updateError

    const archivedNotes = notes.map((n) => ({ ...n, archived: true, archived_at: now }))
    return { archivedCount: archivedNotes.length, notes: archivedNotes as EncounterNote[] }
  },

  // ===== HELP REQUESTS =====

  createHelpRequest: async (request) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('help_requests')
      .insert({
        member_id: user.id,
        member_name: request.member_name,
        provider_id: request.provider_id,
        category: request.category,
        subject: request.subject,
        message: request.message,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data as HelpRequest
  },

  getMyHelpRequests: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as HelpRequest[]
  },

  getPendingHelpRequests: async () => {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })

    if (error) throw error
    // Sort urgent first
    return ((data || []) as HelpRequest[]).sort((a, b) => {
      if (a.category === 'urgent' && b.category !== 'urgent') return -1
      if (b.category === 'urgent' && a.category !== 'urgent') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  },

  updateHelpRequestStatus: async (requestId: string, status: HelpRequest['status']) => {
    const { data, error } = await supabase
      .from('help_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data as HelpRequest
  },

  resolveHelpRequest: async (requestId: string, resolutionNote: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('help_requests')
      .update({
        status: 'resolved',
        resolution_note: resolutionNote,
        resolved_at: new Date().toISOString(),
        provider_id: user.id,
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data as HelpRequest
  },

  getPendingHelpRequestCount: async () => {
    const { count, error } = await supabase
      .from('help_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) throw error
    return count || 0
  },

  // ===== WAITLIST =====

  joinWaitlist: async (
    providerId: string,
    serviceType: string,
    note?: string,
    preferredDays?: number[],
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check for existing active entry
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('member_id', user.id)
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error('You are already on the waitlist for this provider.')
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        member_id: user.id,
        member_name: user.user_metadata?.token_alias || 'Unknown',
        provider_id: providerId,
        service_type: serviceType,
        preferred_days: preferredDays,
        note,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data as WaitlistEntry
  },

  leaveWaitlist: async (entryId: string) => {
    const { error } = await supabase
      .from('waitlist')
      .update({ status: 'cancelled' })
      .eq('id', entryId)

    if (error) throw error
  },

  getMyWaitlist: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('member_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as WaitlistEntry[]
  },

  getProviderWaitlist: async (providerId: string) => {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as WaitlistEntry[]
  },
}
