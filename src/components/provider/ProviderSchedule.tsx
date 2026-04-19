import React, { useState } from 'react'
import { type Appointment } from '../../lib/api'
import { useProviderSchedule } from '../../hooks/useProviderSchedule'
import { ScheduleHeader } from './schedule/ScheduleHeader'
import { WeekView } from './schedule/WeekView'
import { DayView } from './schedule/DayView'
import { MonthView } from './schedule/MonthView'
import { AppointmentModal } from './schedule/AppointmentModal'
import { RecentActivity } from './schedule/RecentActivity'
import { ConfirmModal } from '../ui/ConfirmModal'
import { User, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { generatePatientCodename } from '../../lib/codenames'

export const ProviderSchedule: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    appointments,
    loading,
    error,
    loadAppointments,
    selectedAppointment,
    setSelectedAppointment,
    patientHistory,
    historyLoading,
    updates,
    showUpdates,
    setShowUpdates,
    isCancelling,
    setIsCancelling,
    cancelReason,
    setCancelReason,
    isSelectionMode,
    setIsSelectionMode,
    selectedSlots,
    toggleSelection,
    handleSelectAll,
    confirmModal,
    setConfirmModal,
    confirmLoading,
    navigate,
    handleToggleBlock,
    handleBulkDelete,
    handleDeleteSlot,
    clearUpdates,
    handleProviderCancel,
  } = useProviderSchedule()

  const [hoveredApt, setHoveredApt] = useState<Appointment | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleHover = (apt: Appointment | null, e?: React.MouseEvent) => {
    setHoveredApt(apt)
    if (e) setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <ScheduleHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        navigate={navigate}
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={setIsSelectionMode}
        selectedSlotsCount={selectedSlots.size}
        handleSelectAll={handleSelectAll}
        handleBulkDelete={handleBulkDelete}
      />

      <div className="flex-1 p-2 md:p-6 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Loading schedule...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-red-200 dark:border-red-900/40">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Failed to load schedule
                </p>
                <p className="text-xs text-slate-500">Check your connection and try again.</p>
              </div>
              <button
                onClick={loadAppointments}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full animate-in fade-in duration-300">
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                appointments={appointments}
                isSelectionMode={isSelectionMode}
                selectedSlots={selectedSlots}
                toggleSelection={toggleSelection}
                setSelectedAppointment={setSelectedAppointment}
                setHoveredApt={handleHover}
                handleToggleBlock={handleToggleBlock}
                handleDeleteSlot={handleDeleteSlot}
              />
            )}
            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                appointments={appointments}
                isSelectionMode={isSelectionMode}
                selectedSlots={selectedSlots}
                toggleSelection={toggleSelection}
                setSelectedAppointment={setSelectedAppointment}
                setHoveredApt={handleHover}
                handleToggleBlock={handleToggleBlock}
                handleDeleteSlot={handleDeleteSlot}
              />
            )}
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                appointments={appointments}
                setSelectedAppointment={setSelectedAppointment}
              />
            )}
          </div>
        )}
      </div>

      <RecentActivity
        updates={updates}
        showUpdates={showUpdates}
        setShowUpdates={setShowUpdates}
        clearUpdates={clearUpdates}
      />

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          patientHistory={patientHistory}
          historyLoading={historyLoading}
          isCancelling={isCancelling}
          setIsCancelling={setIsCancelling}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          handleProviderCancel={handleProviderCancel}
        />
      )}

      {/* Global Tooltip — flips to avoid viewport edges */}
      {hoveredApt &&
        (() => {
          const TOOLTIP_W = 296
          const TOOLTIP_H = hoveredApt.member_id ? 190 : 140
          const left =
            tooltipPos.x + 16 + TOOLTIP_W > window.innerWidth
              ? Math.max(8, tooltipPos.x - TOOLTIP_W - 8)
              : tooltipPos.x + 16
          const top =
            tooltipPos.y + 16 + TOOLTIP_H > window.innerHeight
              ? Math.max(8, tooltipPos.y - TOOLTIP_H - 8)
              : tooltipPos.y + 16

          const hoveredHasConflict = appointments.some(
            (other) =>
              other.id !== hoveredApt.id &&
              parseISO(other.start_time) < parseISO(hoveredApt.end_time) &&
              parseISO(other.end_time) > parseISO(hoveredApt.start_time),
          )

          return (
            <div
              className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-75 bg-slate-900/95 border border-slate-700 shadow-2xl rounded-lg p-3 text-white max-w-[280px] flex flex-col gap-1 backdrop-blur-sm"
              style={{ left, top }}
            >
              {hoveredHasConflict && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wide pb-2 border-b border-amber-800/40 mb-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  Schedule conflict detected
                </div>
              )}
              <div className="font-bold text-sm border-b border-slate-700 pb-2 mb-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                {format(parseISO(hoveredApt.start_time), 'HH:mm')} –{' '}
                {format(parseISO(hoveredApt.end_time), 'HH:mm')}
              </div>
              <div className="py-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                  Details
                </div>
                <div className="text-xs text-slate-200 leading-snug font-medium">
                  {hoveredApt.notes || (hoveredApt.is_booked ? 'No details' : 'Available')}
                </div>
              </div>
              {hoveredApt.member_id && (
                <div className="mt-1 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                    Patient
                  </div>
                  <div className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    {generatePatientCodename(hoveredApt.member_id)}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.action}
          loading={confirmLoading}
          title={confirmModal.title}
          description={confirmModal.description}
          variant={confirmModal.variant}
        />
      )}
    </div>
  )
}
