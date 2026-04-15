import { useState, useEffect } from 'react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { Activity, ChevronDown, Clock, X, Download, Star } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { generateICS } from '../../lib/ics'
import type { Appointment } from '../../lib/api'

/**
 * Live countdown to the next appointment
 */
export function AppointmentCountdown({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculate = () => {
      const diff = parseISO(startTime).getTime() - new Date().getTime()
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      }
    }

    const timer = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <div className="flex gap-4" aria-label="Time remaining until appointment">
      <div className="text-center">
        <div className="text-3xl font-black font-mono tracking-tighter text-white">
          {timeLeft.days}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Days</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-black font-mono tracking-tighter text-white">
          {timeLeft.hours}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-black font-mono tracking-tighter text-white">
          {timeLeft.minutes}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Mins</div>
      </div>
    </div>
  )
}

/**
 * Individual Appointment Row with Expandable Details
 */
export function AppointmentRow({
  appt,
  onReschedule,
  onCancel,
  onFeedback,
  getProviderLocation,
}: {
  appt: Appointment
  onReschedule: (id: string) => void
  onCancel: (id: string) => void
  onFeedback: (id: string) => void
  getProviderLocation: (type?: string) => string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cancelReason = appt.notes
    ?.split('|')
    .find((s: string) => s.trim().startsWith('CANCEL_REASON:'))
    ?.replace('CANCEL_REASON:', '')
    .trim()
  const diff = differenceInMinutes(parseISO(appt.start_time), new Date())
  const isPast = parseISO(appt.start_time) < new Date()

  return (
    <Card
      variant={isExpanded ? 'elevated' : 'default'}
      role="article"
      aria-expanded={isExpanded}
      className={cn(
        'overflow-hidden transition-all duration-300 transform',
        isExpanded
          ? 'scale-[1.01] border-indigo-500/30'
          : 'hover:scale-[1.005] hover:border-indigo-500/10',
        appt.status === 'cancelled' && 'opacity-70 grayscale-[0.5]',
      )}
    >
      <div
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded)
        }}
        tabIndex={0}
        role="button"
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} appointment details for ${format(parseISO(appt.start_time), 'MMM d, HH:mm')}`}
      >
        <div className="flex items-center gap-5">
          {/* Date Badge */}
          <div
            className={cn(
              'flex flex-col items-center justify-center w-14 h-14 border rounded-xl shrink-0 transition-colors',
              appt.status === 'cancelled'
                ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-400'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-300',
            )}
          >
            <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter">
              {format(parseISO(appt.start_time), 'MMM')}
            </span>
            <span className="text-xl font-black tracking-tight leading-none">
              {format(parseISO(appt.start_time), 'dd')}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h4
                className={cn(
                  'text-sm font-black tracking-tight uppercase',
                  appt.status === 'cancelled'
                    ? 'text-slate-400 line-through'
                    : 'text-slate-900 dark:text-white',
                )}
              >
                {format(parseISO(appt.start_time), 'HH:mm')} —{' '}
                {appt.provider?.token_alias || 'Staff Member'}
              </h4>
              {appt.status === 'cancelled' && <Badge variant="danger">Cancelled</Badge>}
              {!isPast && appt.status !== 'cancelled' && diff < 1440 && (
                <Badge
                  variant="outline"
                  className="animate-pulse border-amber-500/50 text-amber-500"
                >
                  Upcoming
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 tracking-wide">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>{getProviderLocation(appt.provider?.service_type)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-20 sm:pl-0">
          <ChevronDown
            className={cn(
              'w-5 h-5 text-slate-300 transition-transform duration-300',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Clinical Details
                </h5>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {appt.notes?.split('|')[0] || 'No visit notes provided.'}
                  </p>
                </div>
              </div>

              {cancelReason && (
                <div>
                  <h5 className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">
                    Cancellation Protocol
                  </h5>
                  <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 italic">
                      "{cancelReason}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Details
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Service Area</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {appt.provider?.service_type || 'General Clinic'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Visit Type</span>
                    <span className="text-indigo-500">
                      {appt.is_video ? 'Telehealth (Encrypted)' : 'In-Clinic (Secure)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Appointment ID</span>
                    <span className="text-slate-400 font-mono tracking-tighter">{appt.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            {appt.status !== 'cancelled' && (
              <>
                {!isPast ? (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        generateICS({
                          title: `Appointment with ${appt.provider?.token_alias || 'Provider'}`,
                          description: appt.notes?.split('|')[0] || 'Medical Appointment',
                          location: getProviderLocation(appt.provider?.service_type),
                          startTime: appt.start_time,
                          endTime: appt.end_time,
                        })
                      }}
                      size="sm"
                      variant="outline"
                      aria-label="Export appointment to iCalendar"
                      className="h-8 text-[10px] font-black"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export .ICS
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onReschedule(appt.id)
                      }}
                      size="sm"
                      variant="outline"
                      aria-label="Reschedule this appointment"
                      className="h-8 text-[10px] font-black"
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Reschedule
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCancel(appt.id)
                      }}
                      size="sm"
                      variant="destructive"
                      aria-label="Cancel this appointment"
                      className="h-8 text-[10px] font-black"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" /> Terminate Session
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFeedback(appt.id)
                    }}
                    size="sm"
                    variant="gradient"
                    aria-label="Provide feedback for this visit"
                    className="h-8 text-[10px] font-black"
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5" /> Review Visit
                  </Button>
                )}
              </>
            )}
            {appt.status === 'cancelled' && (
              <p className="text-[10px] font-bold text-slate-400 italic">
                This record is archived and cannot be modified.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
