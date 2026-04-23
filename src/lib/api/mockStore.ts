import type {
  Appointment,
  EncounterNote,
  HelpRequest,
  WaitlistEntry,
  NoteStatistics,
  Notification,
  NotificationType,
} from './types'

import { encryptPayload, decryptPayload } from '../crypto'

export const mockStore = {
  appointments: [] as Appointment[],
  encounterNotes: [] as EncounterNote[],
  helpRequests: [] as HelpRequest[],
  waitlist: [] as WaitlistEntry[],
  noteStatistics: [] as NoteStatistics[],
  notifications: [] as Notification[],
  init: false,

  load: async () => {
    if (mockStore.init) return
    const stored = localStorage.getItem('MOCK_DB_V5')
    if (stored) {
      const parsed = await decryptPayload(stored)

      const now = new Date()
      let changed = false

      const updatedAppointments = (parsed.appointments || []).map((a: Appointment) => {
        const startTime = new Date(a.start_time)
        const endTime = new Date(a.end_time)
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

        if (endTime < now && (a.status === 'pending' || a.status === 'confirmed')) {
          changed = true
          return { ...a, status: 'completed' }
        }

        if (startTime < thirtyMinutesAgo && a.status === 'pending' && a.member_id) {
          changed = true
          return { ...a, status: 'cancelled', notes: (a.notes || '') + ' [NO-SHOW]' }
        }

        return a
      })

      mockStore.appointments = updatedAppointments
      mockStore.encounterNotes = parsed.encounterNotes || []
      mockStore.helpRequests = parsed.helpRequests || []
      mockStore.waitlist = parsed.waitlist || []
      mockStore.noteStatistics = parsed.noteStatistics || []
      mockStore.notifications = parsed.notifications || []
      mockStore.init = true

      if (changed) {
        await mockStore.save()
      }
    } else {
      // Migration from V4
      const oldStored = localStorage.getItem('MOCK_DB_V4')
      if (oldStored) {
        const parsed = await decryptPayload(oldStored)
        mockStore.appointments = parsed.appointments || []
        mockStore.encounterNotes = parsed.encounterNotes || []
        mockStore.helpRequests = parsed.helpRequests || []
        mockStore.waitlist = parsed.waitlist || []
        mockStore.noteStatistics = parsed.noteStatistics || []
        mockStore.notifications = []
        mockStore.init = parsed.init || false
        await mockStore.save() // save as V5
        localStorage.removeItem('MOCK_DB_V4')
      }
    }
  },

  save: async () => {
    const payload = {
      appointments: mockStore.appointments,
      encounterNotes: mockStore.encounterNotes,
      helpRequests: mockStore.helpRequests,
      waitlist: mockStore.waitlist,
      noteStatistics: mockStore.noteStatistics,
      notifications: mockStore.notifications,
      init: mockStore.init,
    }
    const encrypted = await encryptPayload(payload)
    localStorage.setItem('MOCK_DB_V5', encrypted)
  },

  /** Push a new in-app notification synchronously; persists async. */
  addNotification: (notification: {
    user_id: string
    type: NotificationType
    title: string
    body: string
    metadata?: Record<string, unknown>
  }): Notification => {
    const n: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      created_at: new Date().toISOString(),
    }
    mockStore.notifications.push(n)
    // fire-and-forget
    mockStore.save().catch(() => undefined)
    return n
  },

  reset: () => {
    mockStore.appointments = []
    mockStore.encounterNotes = []
    mockStore.helpRequests = []
    mockStore.waitlist = []
    mockStore.noteStatistics = []
    mockStore.notifications = []
    mockStore.init = false
    localStorage.removeItem('MOCK_DB_V5')
    localStorage.removeItem('MOCK_DB_V4')
    localStorage.removeItem('MOCK_DB_V3')
    localStorage.removeItem('MOCK_DB_V2')
    localStorage.removeItem('MOCK_DB_V1')
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('TACTICAL_PIN_')) {
        localStorage.removeItem(key)
      }
    })
  },
}
