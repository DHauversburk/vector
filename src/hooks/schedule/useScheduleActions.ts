import { useState, useCallback } from 'react'
import { api, type Appointment } from '../../lib/api'
import { toast } from 'sonner'
import { type MutationType } from '../../contexts/OfflineContext'

interface ScheduleActionsParams {
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  executeMutation: (type: MutationType, payload: any, optimisticUpdate?: () => void) => Promise<any>
}

export function useScheduleActions({
  appointments,
  setAppointments,
  executeMutation,
}: ScheduleActionsParams) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
    variant?: 'destructive' | 'warning' | 'primary'
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const toggleSelection = useCallback((id: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedSlots.size === appointments.length) {
      setSelectedSlots(new Set())
    } else {
      setSelectedSlots(new Set(appointments.map((a) => a.id)))
    }
  }, [selectedSlots.size, appointments])

  const handleToggleBlock = async (id: string, isBlocked: boolean) => {
    const previous = [...appointments]
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, is_booked: isBlocked } : a)))
    try {
      await executeMutation('TOGGLE_SLOT_BLOCK', { id, isBlocked })
    } catch {
      setAppointments(previous)
      toast.error('Failed to update status')
    }
  }

  const handleBulkDelete = async () => {
    setConfirmModal({
      open: true,
      title: 'Delete Multiple Slots?',
      description: `Verify: Delete ${selectedSlots.size} slots?`,
      variant: 'destructive',
      action: async () => {
        setConfirmLoading(true)
        const previous = [...appointments]
        const ids = Array.from(selectedSlots)
        setAppointments((prev) => prev.filter((a) => !selectedSlots.has(a.id)))
        try {
          await Promise.all(ids.map((id) => api.deleteAppointment(id)))
          toast.success('Bulk delete complete')
          setSelectedSlots(new Set())
          setIsSelectionMode(false)
          setConfirmModal(null)
        } catch {
          setAppointments(previous)
          toast.error('Bulk action failed')
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleDeleteSlot = async (id: string) => {
    setConfirmModal({
      open: true,
      title: 'Delete Slot?',
      description: 'Permanent removal from schedule.',
      variant: 'destructive',
      action: async () => {
        setConfirmLoading(true)
        const previous = [...appointments]
        setAppointments((prev) => prev.filter((a) => a.id !== id))
        try {
          await api.deleteAppointment(id)
          toast.success('Slot removed')
          setConfirmModal(null)
        } catch {
          setAppointments(previous)
          toast.error('Failed to delete')
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleProviderCancel = async () => {
    if (!selectedAppointment) return
    setConfirmLoading(true)
    try {
      await executeMutation('CANCEL_APPOINTMENT', {
        id: selectedAppointment.id,
        reason: cancelReason,
      })
      toast.success('Appointment cancelled')

      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppointment.id ? { ...a, status: 'cancelled' } : a)),
      )

      setSelectedAppointment(null)
      setIsCancelling(false)
      setCancelReason('')
    } catch {
      toast.error('Cancellation failed')
    } finally {
      setConfirmLoading(false)
    }
  }

  return {
    selectedAppointment,
    setSelectedAppointment,
    isCancelling,
    setIsCancelling,
    cancelReason,
    setCancelReason,
    isSelectionMode,
    setIsSelectionMode,
    selectedSlots,
    setSelectedSlots,
    toggleSelection,
    handleSelectAll,
    confirmModal,
    setConfirmModal,
    confirmLoading,
    handleToggleBlock,
    handleBulkDelete,
    handleDeleteSlot,
    handleProviderCancel,
  }
}
