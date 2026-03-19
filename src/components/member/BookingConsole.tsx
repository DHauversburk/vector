import { useState, useEffect, useMemo } from 'react';
import { api, type Appointment, type WaitlistEntry } from '../../lib/api';
import { format, parseISO, isSameDay } from 'date-fns';
import { Loader2, Calendar, Clock, Lock, Zap, Video } from 'lucide-react';
import { ServiceTeamSelector } from './ServiceTeamSelector';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { logger } from '../../lib/logger';

interface ProviderInfo {
    id: string;
    token_alias: string;
    service_type: string;
}

interface BookingConsoleProps {
    providers: ProviderInfo[];
    appointments: Appointment[];
    myWaitlist: WaitlistEntry[];
    isRescheduling: boolean;
    apptToReschedule: string | null;
    onBookingComplete: () => void;
    onCancelReschedule: () => void;
    onRequestWaitlist: (providerId: string) => void;
}

export function BookingConsole({
    providers,
    appointments,
    myWaitlist,
    isRescheduling,
    apptToReschedule,
    onBookingComplete,
    onCancelReschedule,
    onRequestWaitlist,
}: BookingConsoleProps) {
    const [providerId, setProviderId] = useState('');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<Appointment[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        if (providers.length === 1 && !providerId) {
            setProviderId(providers[0].id);
        }
    }, [providers, providerId]);

    useEffect(() => {
        if (providerId) {
            setSlotsLoading(true);
            const today = new Date().toISOString();
            api.getProviderOpenSlots(providerId, today)
                .then(setAvailableSlots)
                .catch((e) => logger.error('BookingConsole', 'Failed to fetch open slots', e))
                .finally(() => setSlotsLoading(false));
        } else {
            setAvailableSlots([]);
        }
    }, [providerId]);

    const groupedSlots = useMemo(() => {
        const groups: Record<string, Appointment[]> = {};
        availableSlots.forEach(slot => {
            const date = parseISO(slot.start_time);
            const hour = parseInt(format(date, 'H'));

            if (hour < 7 || hour >= 17) return;

            const dateKey = format(date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(slot);
        });
        return groups;
    }, [availableSlots]);

    const firstAvailableSlot = useMemo(() => {
        const sortedDates = Object.keys(groupedSlots).sort();
        for (const date of sortedDates) {
            const hasApptToday = appointments.some(appt =>
                isSameDay(parseISO(appt.start_time), parseISO(date)) && appt.status !== 'cancelled'
            );
            if (!hasApptToday && groupedSlots[date].length > 0) {
                return groupedSlots[date][0];
            }
        }
        return null;
    }, [groupedSlots, appointments]);

    const handleSlotBooking = async (slotId: string) => {
        if (!notes) {
            toast.warning('Please select a Reason for Visit.');
            return;
        }

        const slot = availableSlots.find(s => s.id === slotId);
        if (slot) {
            const hasAppointmentToday = appointments.some(appt =>
                isSameDay(parseISO(appt.start_time), parseISO(slot.start_time)) && appt.status !== 'cancelled'
            );

            if (hasAppointmentToday && !(isRescheduling && apptToReschedule)) {
                toast.error('Scheduling Limit: One appointment per day reached.');
                return;
            }
        }

        setBookingLoading(true);
        try {
            if (isRescheduling && apptToReschedule) {
                await api.rescheduleAppointmentSwap(apptToReschedule, slotId);
                toast.success('Appointment Rescheduled Successfully.');
            } else {
                await api.bookSlot(slotId, notes);
                toast.success('Appointment Confirmed.');
            }

            setProviderId('');
            setNotes('');
            onBookingComplete();
        } catch (error) {
            logger.error('BookingConsole', error);
            toast.error('Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className={`p-6 bg-white dark:bg-slate-900 border rounded-lg shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300 ${isRescheduling ? 'border-amber-200 dark:border-amber-900 ring-1 ring-amber-100 dark:ring-amber-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${isRescheduling ? 'bg-amber-50 dark:bg-amber-950 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'}`}>
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{isRescheduling ? 'Reschedule Appointment' : 'Clinical Service Enrollment'}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Select an available time slot</p>
                    </div>
                </div>
                {isRescheduling && (
                    <button onClick={onCancelReschedule} className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded">
                        Cancel Reschedule
                    </button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <ServiceTeamSelector
                        providers={providers}
                        onProviderSelect={setProviderId}
                        selectedProviderId={providerId}
                    />
                </div>
                <div className="space-y-1.5">
                    <label id="visit-reason-label" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason for Visit</label>
                    <select
                        aria-labelledby="visit-reason-label"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded h-10 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    >
                        <option value="">Select Reason...</option>
                        <option value="Follow-up Visit (Standard)">Follow-up Visit (Standard)</option>
                        <option value="New Health Concern">New Health Concern</option>
                        <option value="Medication Review / Renewal">Medication Review / Renewal</option>
                        <option value="Administrative / Documentation Request">Administrative / Documentation Request</option>
                        <option value="Wellness / Health Screening">Wellness / Health Screening</option>
                        <option value="Acute Symptom / Urgent Question">Acute Symptom / Urgent Question</option>
                    </select>
                </div>
            </div>

            {providerId && (
                <div className="space-y-6 pt-2">
                    {!slotsLoading && firstAvailableSlot && notes && (
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest">Quick Book</h4>
                                        <p className="text-[10px] font-bold text-white/70 mt-0.5">
                                            First available: {format(parseISO(firstAvailableSlot.start_time), 'EEE, MMM d @ HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSlotBooking(firstAvailableSlot.id)}
                                    disabled={bookingLoading}
                                    aria-label={`Quick book first available slot on ${format(parseISO(firstAvailableSlot.start_time), 'MMM d @ HH:mm')}`}
                                    className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-md active:scale-95"
                                >
                                    {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    )}

                    {slotsLoading ? (
                        <div className="flex items-center gap-2 py-8 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                            <span className="text-[10px] font-black uppercase text-slate-300">Syncing Availability Table...</span>
                        </div>
                    ) : Object.keys(groupedSlots).length === 0 ? (
                        <div className="text-center border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-lg space-y-4">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                                No currently available slots for this provider.
                            </div>
                            {myWaitlist.some(w => w.provider_id === providerId && w.status === 'active') ? (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg inline-flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                        You are on the waitlist
                                    </span>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => onRequestWaitlist(providerId)}
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/20"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Join Waitlist
                                </Button>
                            )}
                        </div>
                    ) : (
                        Object.entries(groupedSlots).map(([date, slots]) => {
                            const hasApptToday = appointments.some(appt =>
                                isSameDay(parseISO(appt.start_time), parseISO(date)) && appt.status !== 'cancelled'
                            );
                            const isBlocked = hasApptToday && !(isRescheduling && apptToReschedule);

                            return (
                                <div key={date} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">
                                            {format(parseISO(date), 'EEEE, MMM do')}
                                        </h4>
                                        {isBlocked && (
                                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Existing Appointment
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.id}
                                                onClick={() => handleSlotBooking(slot.id)}
                                                disabled={bookingLoading || isBlocked}
                                                aria-label={`Book slot at ${format(parseISO(slot.start_time), 'HH:mm')}`}
                                                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed rounded transition-all group active:scale-95
                                                    ${isBlocked
                                                        ? 'opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                                        : 'border-emerald-300/50 dark:border-emerald-800/50 bg-emerald-50/10 dark:bg-emerald-900/10 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:shadow-md'
                                                    }`}
                                            >
                                                <span className={`text-xs font-black ${isBlocked ? 'text-slate-400' : 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600'}`}>
                                                    {format(parseISO(slot.start_time), 'HH:mm')}
                                                </span>
                                                {isBlocked ? (
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">LOCKED</span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center justify-center gap-1">
                                                        {slot.is_video && <Video className="w-3 h-3 text-indigo-500" />}
                                                        {slot.is_video ? 'VIDEO' : 'CLINIC'}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
