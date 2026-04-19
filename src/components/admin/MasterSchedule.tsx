import { useEffect, useState, useMemo } from 'react'
import { api } from '../../lib/api'
import { Lock, Unlock, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { logger } from '../../lib/logger'
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

// Shared color constants — grid bars and legend dots must stay in sync
const STATUS_COLORS = {
  pending: { bar: 'bg-slate-300', dot: 'bg-slate-300', label: 'Open' },
  confirmed: { bar: 'bg-indigo-500', dot: 'bg-indigo-500', label: 'Booked' },
  completed: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled: { bar: 'bg-red-400', dot: 'bg-red-400', label: 'Cancelled' },
} as const

const PAGE_SIZE = 25

type StatusFilter = 'all' | keyof typeof STATUS_COLORS

interface AppointmentWithDetails {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  member: { token_alias: string }
  provider: { token_alias: string; service_type: string }
}

interface MasterScheduleProps {
  actionContext: 'view' | 'block' | 'unblock' | 'override'
}

const toDateInputValue = (d: Date) => format(d, 'yyyy-MM-dd')

export default function MasterSchedule({ actionContext }: MasterScheduleProps) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const now = new Date()
  const [startDate, setStartDate] = useState(
    toDateInputValue(startOfWeek(now, { weekStartsOn: 1 })),
  )
  const [endDate, setEndDate] = useState(toDateInputValue(endOfWeek(now, { weekStartsOn: 1 })))

  // Pagination
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAllAppointments()
      // @ts-expect-error - Event type mismatch with library definition
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
      logger.error('MasterSchedule', 'Failed to fetch schedule', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredApts = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false

      // Date range filter
      try {
        const aptDate = parseISO(apt.start_time)
        const start = new Date(startDate + 'T00:00:00')
        const end = new Date(endDate + 'T23:59:59')
        if (!isWithinInterval(aptDate, { start, end })) return false
      } catch {
        // If date parsing fails, include the appointment
      }

      return true
    })
  }, [appointments, statusFilter, startDate, endDate])

  const totalPages = Math.ceil(filteredApts.length / PAGE_SIZE)
  const pagedApts = filteredApts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleFilterChange = (newFilter: StatusFilter) => {
    setStatusFilter(newFilter)
    setPage(0)
  }

  const handleSlotClick = async (apt: AppointmentWithDetails) => {
    if (actionContext === 'view') return

    let newStatus: string | null = null
    if (actionContext === 'block') newStatus = 'cancelled'
    if (actionContext === 'unblock') newStatus = 'pending'

    if (newStatus) {
      const originalStatus = apt.status
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === apt.id ? { ...a, status: newStatus as AppointmentWithDetails['status'] } : a,
        ),
      )

      try {
        await api.updateAppointmentStatus(apt.id, newStatus as AppointmentWithDetails['status'])
      } catch (err) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? { ...a, status: originalStatus } : a)),
        )
        logger.error('MasterSchedule', 'Failed to update status', err)
      }
    }
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Loading schedule...
        </span>
      </div>
    )

  if (error)
    return (
      <div className="p-8 text-center text-red-700 bg-red-50 rounded border border-red-100 mx-6 shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <h3 className="font-black uppercase text-xs tracking-widest mb-1">
          Failed to load schedule
        </h3>
        <p className="text-xs font-bold text-red-600/70 uppercase mb-4">{error}</p>
        <button
          onClick={fetchSchedule}
          className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col">
          <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Master Schedule
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              {filteredApts.length} appointment{filteredApts.length !== 1 ? 's' : ''} shown
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 hidden sm:block">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
              className="h-8 px-2 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Schedule start date"
            />
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              –
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
              className="h-8 px-2 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Schedule end date"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
            className="h-8 px-2 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Open</option>
            <option value="confirmed">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={fetchSchedule}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-900/20">
        {pagedApts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm text-center max-w-sm">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No appointments scheduled for this period
              </p>
              <p className="text-[10px] mt-2 text-slate-400">
                {statusFilter !== 'all'
                  ? 'Try changing the status filter or expanding the date range.'
                  : 'Adjust the date range or ask providers to generate slots.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
            {pagedApts.map((apt) => {
              const colors = STATUS_COLORS[apt.status] ?? STATUS_COLORS.pending
              return (
                <div
                  key={apt.id}
                  onClick={() => handleSlotClick(apt)}
                  className={`
                    relative p-2.5 rounded border transition-all cursor-pointer group shadow-sm bg-white dark:bg-slate-900
                    ${
                      apt.status === 'cancelled'
                        ? 'border-red-100 dark:border-red-900/30 bg-red-50/30 grayscale opacity-60'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/10'
                    }
                    ${actionContext !== 'view' ? 'hover:-translate-y-0.5' : ''}
                  `}
                >
                  {/* Status Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] rounded-t ${colors.bar}`}
                  />

                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">
                      {format(parseISO(apt.start_time), 'HH:mm')}
                    </span>
                    <div className="flex gap-1.5">
                      {apt.status === 'cancelled' && <Lock className="w-2.5 h-2.5 text-red-500" />}
                      {actionContext !== 'view' && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {actionContext === 'block' && <Lock className="w-3 h-3 text-red-500" />}
                          {actionContext === 'unblock' && (
                            <Unlock className="w-3 h-3 text-indigo-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate leading-none">
                      {format(parseISO(apt.start_time), 'MMM d')} ·{' '}
                      {apt.provider?.service_type || 'GENERAL'}
                    </div>
                    <div
                      className={`text-[11px] font-bold truncate leading-tight ${
                        apt.status === 'cancelled'
                          ? 'text-red-700 dark:text-red-400'
                          : apt.member?.token_alias
                            ? 'text-indigo-700 dark:text-indigo-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {apt.status === 'cancelled'
                        ? 'CANCELLED'
                        : apt.member?.token_alias || 'AVAILABLE'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer — Legend + Pagination */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {(
            Object.entries(STATUS_COLORS) as [
              keyof typeof STATUS_COLORS,
              (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS],
            ][]
          ).map(([, cfg]) => (
            <div key={cfg.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {cfg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
