import { mockStore } from '../mockStore'
import type { EncounterNote, HelpRequest, WaitlistEntry, NoteStatistics } from '../types'
import type { IInteractionActions } from '../interfaces'
import { supabase } from '../../supabase'

// Helper to update aggregated statistics
const updateStats = (note: EncounterNote) => {
  const noteDate = new Date(note.created_at)
  const period = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}`

  let statsIndex = mockStore.noteStatistics.findIndex(
    (s) => s.period === period && s.provider_id === note.provider_id,
  )

  if (statsIndex === -1) {
    mockStore.noteStatistics.push({
      period,
      provider_id: note.provider_id,
      total_encounters: 0,
      by_category: {
        question: 0,
        counseling: 0,
        reschedule: 0,
        follow_up: 0,
        routine: 0,
        urgent: 0,
        administrative: 0,
        other: 0,
      },
      unique_patients: 0,
      requires_action_count: 0,
      created_at: new Date().toISOString(),
    })
    statsIndex = mockStore.noteStatistics.length - 1
  }

  const stats = mockStore.noteStatistics[statsIndex]
  stats.total_encounters++
  if (stats.by_category[note.category] !== undefined) {
    stats.by_category[note.category]++
  }

  const existingForMember = mockStore.encounterNotes.some(
    (n) =>
      n.member_id === note.member_id &&
      n.provider_id === note.provider_id &&
      n.created_at.startsWith(period) &&
      n.id !== note.id,
  )

  if (!existingForMember) {
    stats.unique_patients++
  }

  if (note.status === 'requires_action') {
    stats.requires_action_count++
  }
}

export const mockInteractions: IInteractionActions = {
  addEncounterNote: async (
    note: Omit<EncounterNote, 'id' | 'created_at'> & { id?: string },
  ): Promise<EncounterNote> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const newNote: EncounterNote = {
      id: note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider_id: user.id,
      member_id: note.member_id,
      member_name: note.member_name,
      category: note.category,
      content: note.content,
      created_at: new Date().toISOString(),
      resolved: false,
      status: note.status || 'active',
      archived: note.archived || false,
    }

    await mockStore.load()
    mockStore.encounterNotes.push(newNote)
    updateStats(newNote)
    await mockStore.save()
    return newNote
  },

  getNoteStatistics: async (months: number = 6): Promise<NoteStatistics[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    await mockStore.load()
    return mockStore.noteStatistics
      .filter((s) => s.provider_id === user.id)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, months)
  },

  getProviderEncounterNotes: async (
    limit: number = 50,
    includeArchived: boolean = false,
  ): Promise<EncounterNote[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    await mockStore.load()
    return mockStore.encounterNotes
      .filter((n) => n.provider_id === user.id && (includeArchived || !n.archived))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  },

  archiveNote: async (noteId: string): Promise<EncounterNote | null> => {
    await mockStore.load()
    const idx = mockStore.encounterNotes.findIndex((n) => n.id === noteId)
    if (idx >= 0) {
      mockStore.encounterNotes[idx].archived = true
      mockStore.encounterNotes[idx].archived_at = new Date().toISOString()
      await mockStore.save()
      return mockStore.encounterNotes[idx]
    }
    return null
  },

  unarchiveNote: async (noteId: string): Promise<EncounterNote | null> => {
    await mockStore.load()
    const idx = mockStore.encounterNotes.findIndex((n) => n.id === noteId)
    if (idx >= 0) {
      mockStore.encounterNotes[idx].archived = false
      mockStore.encounterNotes[idx].archived_at = undefined
      await mockStore.save()
      return mockStore.encounterNotes[idx]
    }
    return null
  },

  updateNoteStatus: async (
    noteId: string,
    status: EncounterNote['status'],
  ): Promise<EncounterNote | null> => {
    await mockStore.load()
    const idx = mockStore.encounterNotes.findIndex((n) => n.id === noteId)
    if (idx >= 0) {
      mockStore.encounterNotes[idx].status = status
      mockStore.encounterNotes[idx].updated_at = new Date().toISOString()
      await mockStore.save()
      return mockStore.encounterNotes[idx]
    }
    return null
  },

  getMemberEncounterNotes: async (memberId: string): Promise<EncounterNote[]> => {
    await mockStore.load()
    return mockStore.encounterNotes
      .filter((n) => n.member_id === memberId && !n.archived)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  linkNoteToFollowUp: async (
    noteId: string,
    appointmentId: string,
  ): Promise<EncounterNote | null> => {
    await mockStore.load()
    const idx = mockStore.encounterNotes.findIndex((n) => n.id === noteId)
    if (idx >= 0) {
      mockStore.encounterNotes[idx].follow_up_appointment_id = appointmentId
      mockStore.encounterNotes[idx].updated_at = new Date().toISOString()
      await mockStore.save()
      return mockStore.encounterNotes[idx]
    }
    return null
  },

  updateNote: async (
    noteId: string,
    updates: Partial<EncounterNote>,
  ): Promise<EncounterNote | null> => {
    await mockStore.load()
    const idx = mockStore.encounterNotes.findIndex((n) => n.id === noteId)
    if (idx >= 0) {
      mockStore.encounterNotes[idx] = {
        ...mockStore.encounterNotes[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      await mockStore.save()
      return mockStore.encounterNotes[idx]
    }
    return null
  },

  bulkArchiveNotes: async (
    beforeDate: string,
    providerId?: string,
  ): Promise<{ archivedCount: number; notes: EncounterNote[] }> => {
    await mockStore.load()
    const cutoffDate = new Date(beforeDate)
    const now = new Date().toISOString()
    let archivedCount = 0
    const archivedNotes: EncounterNote[] = []

    mockStore.encounterNotes.forEach((note, idx) => {
      if (note.archived) return
      if (providerId && note.provider_id !== providerId) return
      const noteDate = new Date(note.created_at)
      if (noteDate < cutoffDate) {
        mockStore.encounterNotes[idx].archived = true
        mockStore.encounterNotes[idx].archived_at = now
        archivedCount++
        archivedNotes.push(mockStore.encounterNotes[idx])
      }
    })

    await mockStore.save()
    return { archivedCount, notes: archivedNotes }
  },

  createHelpRequest: async (
    request: Omit<HelpRequest, 'id' | 'member_id' | 'status' | 'created_at'> & { id?: string },
  ): Promise<HelpRequest> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const newRequest: HelpRequest = {
      id: request.id || `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      member_id: user.id,
      member_name: request.member_name,
      provider_id: request.provider_id,
      category: request.category,
      subject: request.subject,
      message: request.message,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    await mockStore.load()
    mockStore.helpRequests.push(newRequest)
    await mockStore.save()
    return newRequest
  },

  getMyHelpRequests: async (): Promise<HelpRequest[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    await mockStore.load()
    return mockStore.helpRequests
      .filter((r) => r.member_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getPendingHelpRequests: async (): Promise<HelpRequest[]> => {
    await mockStore.load()
    return mockStore.helpRequests
      .filter((r) => r.status === 'pending' || r.status === 'in_progress')
      .sort((a, b) => {
        if (a.category === 'urgent' && b.category !== 'urgent') return -1
        if (b.category === 'urgent' && a.category !== 'urgent') return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  },

  updateHelpRequestStatus: async (
    requestId: string,
    status: HelpRequest['status'],
  ): Promise<HelpRequest | null> => {
    await mockStore.load()
    const idx = mockStore.helpRequests.findIndex((r) => r.id === requestId)
    if (idx >= 0) {
      mockStore.helpRequests[idx].status = status
      await mockStore.save()
      return mockStore.helpRequests[idx]
    }
    return null
  },

  resolveHelpRequest: async (
    requestId: string,
    resolutionNote: string,
  ): Promise<HelpRequest | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    await mockStore.load()
    const idx = mockStore.helpRequests.findIndex((r) => r.id === requestId)
    if (idx >= 0) {
      mockStore.helpRequests[idx].status = 'resolved'
      mockStore.helpRequests[idx].resolved_at = new Date().toISOString()
      mockStore.helpRequests[idx].resolution_note = resolutionNote
      mockStore.helpRequests[idx].provider_id = user.id
      await mockStore.save()
      return mockStore.helpRequests[idx]
    }
    return null
  },

  getPendingHelpRequestCount: async (): Promise<number> => {
    await mockStore.load()
    return mockStore.helpRequests.filter((r) => r.status === 'pending').length
  },

  joinWaitlist: async (
    providerId: string,
    serviceType: string,
    note?: string,
    preferredDays?: number[],
  ): Promise<WaitlistEntry> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const entry: WaitlistEntry = {
      id: `wait-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      member_id: user.id,
      member_name: user.user_metadata?.token_alias || 'Unknown',
      provider_id: providerId,
      service_type: serviceType,
      preferred_days: preferredDays,
      note: note,
      status: 'active',
      created_at: new Date().toISOString(),
    }

    await mockStore.load()
    const existing = mockStore.waitlist.find(
      (w) => w.member_id === user.id && w.provider_id === providerId && w.status === 'active',
    )
    if (existing) throw new Error('You are already on the waitlist for this provider.')

    mockStore.waitlist.push(entry)
    await mockStore.save()
    return entry
  },

  leaveWaitlist: async (entryId: string): Promise<void> => {
    await mockStore.load()
    const idx = mockStore.waitlist.findIndex((w) => w.id === entryId)
    if (idx >= 0) {
      mockStore.waitlist[idx].status = 'cancelled'
      await mockStore.save()
    }
  },

  getMyWaitlist: async (): Promise<WaitlistEntry[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    await mockStore.load()
    return mockStore.waitlist
      .filter((w) => w.member_id === user.id && w.status === 'active')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getProviderWaitlist: async (providerId: string): Promise<WaitlistEntry[]> => {
    await mockStore.load()
    return mockStore.waitlist
      .filter((w) => w.provider_id === providerId && w.status === 'active')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },
}
