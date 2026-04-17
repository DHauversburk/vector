import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfWeek, addDays, startOfMonth, parseISO } from 'date-fns'
import { api, type Appointment, type ScheduleUpdate, type ViewMode } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { generatePatientCodename } from '../../lib/codenames'
import { logger } from '../../lib/logger'
import { toast } from 'sonner'

interface ScheduleDataParams {
  currentDate: Date
  viewMode: ViewMode
}

export function useScheduleData({ currentDate, viewMode }: ScheduleDataParams) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [patientHistory, setPatientHistory] = useState<Appointment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [updates, setUpdates] = useState<ScheduleUpdate[]>([])
  const [showUpdates, setShowUpdates] = useState(false)

  const lastFetchRef = useRef<string[]>([])
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let start = startOfWeek(currentDate, { weekStartsOn: 0 })
      let end = addDays(start, 7)

      if (viewMode === 'month') {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
        end = addDays(start, 42)
      } else if (viewMode === 'day') {
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
      }

      const data = await api.getProviderSchedule(user.id, start.toISOString(), end.toISOString())
      setAppointments(data)
      lastFetchRef.current = data.map((a) => a.id)
    } catch (error) {
      logger.error('useScheduleData', 'Failed to load schedule', error)
      toast.error('Failed to sync schedule')
    } finally {
      setLoading(false)
    }
  }, [currentDate, viewMode])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Auto-refresh logic (Polling for new appointments)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) return

      let start = startOfWeek(currentDate, { weekStartsOn: 0 })
      let end = addDays(start, 7)
      if (viewMode === 'month') {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
        end = addDays(start, 42)
      } else if (viewMode === 'day') {
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
      }

      try {
        const newData = await api.getProviderSchedule(
          currentUser.id,
          start.toISOString(),
          end.toISOString(),
        )
        const oldIds = lastFetchRef.current
        const newIds = newData.map((a) => a.id)
        const addedAppointments = newData.filter((a) => a.member_id && !oldIds.includes(a.id))

        if (addedAppointments.length > 0) {
          const newUpdates: ScheduleUpdate[] = addedAppointments.map((a) => ({
            id: a.id,
            type: 'new',
            patientName: generatePatientCodename(a.member_id || ''),
            reason: a.notes || 'General Visit',
            time: format(parseISO(a.start_time), 'MMM d @ HH:mm'),
            timestamp: new Date(),
          }))
          setUpdates((prev) => [...newUpdates, ...prev].slice(0, 10))
          setShowUpdates(true)
        }
        lastFetchRef.current = newIds
        setAppointments(newData)
      } catch (err) {
        logger.error('useScheduleData', 'Auto-refresh failed', err)
      }
    }, 30000)

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [currentDate, viewMode])

  const loadPatientHistory = useCallback(async (memberId?: string) => {
    if (!memberId) {
      setPatientHistory([])
      return
    }
    setHistoryLoading(true)
    try {
      const allAppts = await api.getAllAppointments()
      const patientAppts = allAppts.filter((a) => a.member_id === memberId)
      setPatientHistory(
        patientAppts.sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
        ),
      )
    } catch (err) {
      logger.error('useScheduleData', 'Failed to load history', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const clearUpdates = useCallback(() => {
    setUpdates([])
    setShowUpdates(false)
  }, [])

  return {
    appointments,
    setAppointments, // Needed for optimistic updates in actions
    loading,
    patientHistory,
    historyLoading,
    loadPatientHistory,
    updates,
    showUpdates,
    setShowUpdates,
    clearUpdates,
    loadAppointments,
  }
}
