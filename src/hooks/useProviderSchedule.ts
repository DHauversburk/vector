import { useEffect } from 'react'
import { useOffline } from '../contexts/OfflineContext'

// Sub-hooks
import { useScheduleState } from './schedule/useScheduleState'
import { useScheduleData } from './schedule/useScheduleData'
import { useScheduleActions } from './schedule/useScheduleActions'

/**
 * Orchestrator hook for Provider Scheduling logic.
 * Manages calendar state, data synchronization, and user actions.
 */
export function useProviderSchedule() {
  const { executeMutation } = useOffline()

  // 1. Core State (View modes, Current date, Navigation)
  const { viewMode, setViewMode, currentDate, setCurrentDate, navigate } = useScheduleState()

  // 2. Data Synchronization (Fetching, Auto-refresh, history)
  const {
    appointments,
    setAppointments,
    loading,
    error,
    patientHistory,
    historyLoading,
    loadPatientHistory,
    updates,
    showUpdates,
    setShowUpdates,
    clearUpdates,
    loadAppointments,
  } = useScheduleData({ currentDate, viewMode })

  // 3. Command/Actions (Mutations, Cancellations, Deletes)
  const {
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
  } = useScheduleActions({ appointments, setAppointments, executeMutation })

  // Bridge: Select Appointment -> Load History
  useEffect(() => {
    loadPatientHistory(selectedAppointment?.member_id || undefined)
  }, [selectedAppointment?.member_id, loadPatientHistory])

  return {
    // State
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    navigate,

    // Data
    appointments,
    loading,
    error,
    patientHistory,
    historyLoading,
    updates,
    showUpdates,
    setShowUpdates,
    clearUpdates,
    loadAppointments,

    // Selection & Actions
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

    // Handlers
    handleToggleBlock,
    handleBulkDelete,
    handleDeleteSlot,
    handleProviderCancel,
  }
}
