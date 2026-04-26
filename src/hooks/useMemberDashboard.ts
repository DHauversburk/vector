import { useState, useCallback, useEffect } from 'react'
import { swrFetcher } from '../lib/api/swr-fetcher'
import useSWR, { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { useOffline } from './useOffline'
import { parseISO, differenceInMinutes } from 'date-fns'
import { type Appointment, type WaitlistEntry } from '../lib/api'
import { logger } from '../lib/logger'

export function useMemberDashboard() {
  const { user, signOut } = useAuth()
  const { mutate } = useSWRConfig()
  const { executeMutation, isOnline } = useOffline()

  // Remote Data via SWR
  const { data: rawAppointments = [], isLoading: apptsLoading } = useSWR('appointments', swrFetcher)
  const { data: rawProviders = [], isLoading: providersLoading } = useSWR('providers', swrFetcher)
  const { data: rawWaitlist = [], isLoading: waitlistLoading } = useSWR('waitlist', swrFetcher)

  const loading = apptsLoading || providersLoading || waitlistLoading
  const appointments = rawAppointments as Appointment[]
  const myWaitlist = rawWaitlist as WaitlistEntry[]

  // Unique Providers Filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing; tracked by P2 epic
  const providers = ((rawProviders as any[]) || []).filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) => t.token_alias === item.token_alias && t.service_type === item.service_type,
      ),
  ) as { id: string; token_alias: string; service_type: string }[]

  // UI States
  const [bookingOpen, setBookingOpen] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [apptToReschedule, setApptToReschedule] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackApptId, setFeedbackApptId] = useState<string | null>(null)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistProviderId, setWaitlistProviderId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'ops' | 'resources' | 'security' | 'account'>('ops')
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  useEffect(() => {
    const handleNav = (e: Event) => {
      const ce = e as CustomEvent
      if (['ops', 'resources', 'security'].includes(ce.detail)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing; tracked by P2 epic
        setActiveTab(ce.detail as any)
      } else if (ce.detail === 'schedule') {
        setActiveTab('ops')
      }
    }
    window.addEventListener('vector-navigate', handleNav)
    return () => window.removeEventListener('vector-navigate', handleNav)
  }, [])

  // BookingConsole renders inline within the ops tab. If the user navigates
  // away, close it so it doesn't bleed onto the next view when they return.
  useEffect(() => {
    if (activeTab !== 'ops') {
      setBookingOpen(false)
      setIsRescheduling(false)
      setApptToReschedule(null)
    }
  }, [activeTab])

  const startReschedule = useCallback((apptId: string) => {
    setIsRescheduling(true)
    setApptToReschedule(apptId)
    setBookingOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const cancelReschedule = useCallback(() => {
    setIsRescheduling(false)
    setApptToReschedule(null)
    setBookingOpen(false)
  }, [])

  const handleBookingComplete = useCallback(() => {
    setBookingOpen(false)
    setIsRescheduling(false)
    setApptToReschedule(null)
    mutate('appointments')
  }, [mutate])

  // Cancel with optional reason. Within 30 minutes of the appointment the
  // AppointmentRow modal requires the reason field (so the provider knows why
  // the patient no-showed); outside that window the reason is optional but
  // still forwarded if provided. The API already persists it to
  // appointments.cancel_reason (supabase.ts has a TODO migration) and falls
  // back to a `| CANCEL_REASON: ...` suffix on notes in mock mode.
  const handleCancel = async (id: string, reason?: string) => {
    const appt = appointments.find((a) => a.id === id)
    const isLate = appt ? differenceInMinutes(parseISO(appt.start_time), new Date()) < 30 : false

    if (isLate && !reason?.trim()) {
      toast.error('A reason is required to cancel within 30 minutes of your appointment.')
      return
    }

    const toastId = toast.loading(
      isOnline ? 'Cancelling appointment...' : 'Queueing cancellation...',
    )
    try {
      await executeMutation('CANCEL_APPOINTMENT', { id, reason: reason?.trim() || undefined })
      toast.success(isOnline ? 'Appointment cancelled.' : 'Cancellation queued for sync.', {
        id: toastId,
      })
      mutate('appointments')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing; tracked by P2 epic
    } catch (error: any) {
      logger.error('useMemberDashboard', 'Cancellation error:', error)
      toast.error(`Couldn't cancel: ${error.message || 'unknown error'}`, { id: toastId })
    }
  }

  return {
    user,
    signOut,
    appointments,
    providers,
    myWaitlist,
    loading,
    bookingOpen,
    setBookingOpen,
    isRescheduling,
    apptToReschedule,
    startReschedule,
    cancelReschedule,
    feedbackOpen,
    setFeedbackOpen,
    feedbackApptId,
    setFeedbackApptId,
    waitlistOpen,
    setWaitlistOpen,
    waitlistProviderId,
    setWaitlistProviderId,
    activeTab,
    setActiveTab,
    helpModalOpen,
    setHelpModalOpen,
    handleCancel,
    handleBookingComplete,
    isOnline,
  }
}
