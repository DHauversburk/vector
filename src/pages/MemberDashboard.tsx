import { useState, lazy, Suspense } from 'react';
import { type Appointment, type WaitlistEntry } from '../lib/api';
import { swrFetcher } from '../lib/api/swr-fetcher';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { Loader2, Clock, Shield, Activity, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import { WelcomeModal } from '../components/onboarding/WelcomeModal';
import { useOffline } from '../hooks/useOffline';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// --- LAZY-LOADED COMPONENTS ---
const SecuritySettings = lazy(() => import('../components/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const PatientResourcesView = lazy(() => import('../components/member/PatientResourcesView').then(m => ({ default: m.PatientResourcesView })));
const HelpRequestModal = lazy(() => import('../components/ui/HelpRequestModal').then(m => ({ default: m.HelpRequestModal })));
const WaitlistModal = lazy(() => import('../components/ui/WaitlistModal').then(m => ({ default: m.WaitlistModal })));

// --- FEATURE COMPONENTS (Direct) ---
import { QuickActionsPanel } from '../components/member/QuickActionsPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { AppointmentRow, AppointmentCountdown } from '../components/member/AppointmentTimeline';
import { FeedbackModal } from '../components/member/FeedbackModal';
import { BookingConsole } from '../components/member/BookingConsole';
import { logger } from '../lib/logger';

/**
 * Feature-level loading fallback
 */
const FeatureLoading = () => (
    <div className="w-full flex justify-center py-12">
        <LoadingState message="ACCESSING MEDICAL DATA..." />
    </div>
);

export default function MemberDashboard() {
    const { user, signOut } = useAuth();
    const { mutate } = useSWRConfig();
    const { executeMutation, isOnline } = useOffline();

    
    // Remote Data via SWR (Caching + Deduplication)
    const { data: rawAppointments = [], isLoading: apptsLoading } = useSWR('appointments', swrFetcher);
    const { data: rawProviders = [], isLoading: providersLoading } = useSWR('providers', swrFetcher);
    const { data: rawWaitlist = [], isLoading: waitlistLoading } = useSWR('waitlist', swrFetcher);

    const loading = apptsLoading || providersLoading || waitlistLoading;
    const appointments = rawAppointments as Appointment[];
    const myWaitlist = rawWaitlist as WaitlistEntry[];
    
    // Unique Providers Filter
    const providers = (rawProviders as any[]).filter((item, index, self) => 
        index === self.findIndex((t) => (
            t.token_alias === item.token_alias && t.service_type === item.service_type
        ))
    ) as { id: string, token_alias: string, service_type: string }[];

    const [bookingOpen, setBookingOpen] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [apptToReschedule, setApptToReschedule] = useState<string | null>(null);

    // Feedback State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackApptId, setFeedbackApptId] = useState<string | null>(null);

    // Waitlist State
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [waitlistProviderId, setWaitlistProviderId] = useState<string>('');

    // Navigation State
    const [activeTab, setActiveTab] = useState<'ops' | 'resources' | 'security'>('ops');
    const [appointView, setAppointView] = useState<'upcoming' | 'history'>('upcoming');

    // Help Request State
    const [helpModalOpen, setHelpModalOpen] = useState(false);

    const startReschedule = (apptId: string) => {
        setIsRescheduling(true);
        setApptToReschedule(apptId);
        setBookingOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelReschedule = () => {
        setIsRescheduling(false);
        setApptToReschedule(null);
        setBookingOpen(false);
    };

    // Helper to determine location based on team/service
    const getProviderLocation = (serviceType?: string) => {
        const t = (serviceType || '').toUpperCase();
        if (t.includes('GREEN') || t.includes('MH')) return 'Clinical Node B-4 (Bldg 210)';
        if (t.includes('BLUE') || t.includes('PT')) return 'Rehab Center - Wing C';
        if (t.includes('RED') || t.includes('MED') || t.includes('FAMILY')) return 'Primary Care - Bldg 1';
        return 'Main Clinic Front Desk';
    };

    const handleCancel = async (id: string) => {
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            const minutesUntil = differenceInMinutes(parseISO(appt.start_time), new Date());
            if (minutesUntil < 30) {
                toast.error('LATE CANCELLATION FORBIDDEN: Cannot cancel within 30 minutes of mission start.');
                return;
            }
        }

        const toastId = toast.loading(isOnline ? 'Neutralizing appointment entry...' : 'Queueing cancellation request...');
        try {
            await executeMutation('CANCEL_APPOINTMENT', { id });
            toast.success(isOnline ? 'Appointment entry neutralized.' : 'Cancellation queued for sync.', { id: toastId });
            mutate('appointments');

        } catch (error: any) {
            logger.error('MemberDashboard', 'Cancellation error:', error);
            toast.error(`Cancellation Failed: ${error.message || 'Unknown protocol error'}`, { id: toastId });
        }
    };

    const navItems: NavItem[] = [
        { id: 'ops', label: 'My Care', icon: Activity, onClick: () => setActiveTab('ops'), dataTour: 'nav-overview' },
        { id: 'resources', label: 'Resources', icon: FileText, onClick: () => setActiveTab('resources') },
        { id: 'security', label: 'Security', icon: Shield, onClick: () => setActiveTab('security') },
    ];

    if (loading && appointments.length === 0) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing My Care Profile...</span>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            navItems={navItems}
            activeTab={activeTab}
            user={user}
            role="Member"
            onSignOut={signOut}
            title="VECTOR"
        >
            <WelcomeModal role="member" userName={user?.user_metadata?.token_alias || user?.email} />
            <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 pb-20">
                {activeTab === 'ops' && (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
                        <header data-tour="dashboard-title">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Member Dashboard</h2>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Manage your care and appointments securely</p>
                        </header>

                        {/* Upcoming Session Countdown */}
                        {appointments.length > 0 && appointments.some(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled') && (
                            <Card variant="glass" withGradientBorder className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-none shadow-2xl overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                                <CardContent className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-6 md:p-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Clock className="w-10 h-10 text-indigo-300" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Upcoming Mission</p>
                                            {(() => {
                                                const nextAppt = appointments
                                                    .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                                return (
                                                    <>
                                                        <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                                                            {format(parseISO(nextAppt.start_time), 'EEEE, MMMM do')}
                                                        </h2>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black uppercase text-indigo-200">
                                                                {format(parseISO(nextAppt.start_time), 'HH:mm')}
                                                            </div>
                                                            <span className="text-slate-500 text-xs">•</span>
                                                            <CardDescription className="text-slate-400 font-bold uppercase tracking-tight">
                                                                {nextAppt.notes?.split('|').find((s: string) => s.trim().startsWith('Location:'))?.replace('Location:', '').trim() || getProviderLocation(nextAppt.provider?.service_type)}
                                                            </CardDescription>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {(() => {
                                        const nextAppt = appointments
                                            .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                        return <AppointmentCountdown startTime={nextAppt.start_time} />;
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        <QuickActionsPanel
                            onBook={() => setBookingOpen(true)}
                            onViewSchedule={() => {
                                const el = document.getElementById('schedule-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                setAppointView('upcoming');
                            }}
                            onRequestHelp={() => setHelpModalOpen(true)}
                        />

                        {/* Booking Console */}
                        {bookingOpen && (
                            <BookingConsole
                                providers={providers}
                                appointments={appointments}
                                myWaitlist={myWaitlist}
                                isRescheduling={isRescheduling}
                                apptToReschedule={apptToReschedule}
                                onBookingComplete={() => {
                                    mutate('appointments');
                                    mutate('waitlist');
                                    setBookingOpen(false);
                                    setIsRescheduling(false);
                                    setApptToReschedule(null);
                                }}
                                onCancelReschedule={cancelReschedule}
                                onRequestWaitlist={(id) => {
                                    setWaitlistProviderId(id);
                                    setWaitlistOpen(true);
                                }}
                            />
                        )}

                        {/* Schedule Timeline */}
                        <Card variant="default" id="schedule-section" data-tour="nav-appointments" className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setAppointView('upcoming')}
                                        className={`text-xs font-black uppercase tracking-widest transition-all ${appointView === 'upcoming' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-[17px]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        My Schedule
                                    </button>
                                    <button
                                        onClick={() => setAppointView('history')}
                                        className={`text-xs font-black uppercase tracking-widest transition-all ${appointView === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-[17px]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        History / Past
                                    </button>
                                </div>
                                <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                                    {appointView === 'upcoming' ? 'Active' : 'Archived'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-3">
                                    {(() => {
                                        const now = new Date();
                                        const filtered = appointView === 'upcoming'
                                            ? appointments.filter(a => a.status !== 'cancelled' && new Date(a.start_time) >= now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            : appointments.filter(a => a.status === 'cancelled' || new Date(a.start_time) < now).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                                        if (filtered.length === 0) return (
                                            <div className="text-center py-20 bg-slate-50/10 dark:bg-slate-900/10 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                                                <Clock className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                                                    {appointView === 'upcoming' ? 'No Upcoming Appointments' : 'No History Records Found'}
                                                </p>
                                            </div>
                                        );

                                        return filtered.map((apt) => (
                                            <AppointmentRow
                                                key={apt.id}
                                                appt={apt}
                                                onReschedule={startReschedule}
                                                onCancel={handleCancel}
                                                onFeedback={(id) => {
                                                    setFeedbackOpen(true);
                                                    setFeedbackApptId(id);
                                                }}
                                                getProviderLocation={getProviderLocation}
                                            />
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <Card variant="default" className="shadow-sm animate-in fade-in duration-500">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-widest text-lg font-black">Health Resources</CardTitle>
                            <CardDescription className="uppercase text-[10px] font-bold">Educational materials from your healthcare providers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ErrorBoundary name="ResourcesView">
                                <Suspense fallback={<FeatureLoading />}>
                                    <PatientResourcesView />
                                </Suspense>
                            </ErrorBoundary>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'security' && (
                    <ErrorBoundary name="SecuritySettings">
                        <Suspense fallback={<FeatureLoading />}>
                            <SecuritySettings />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </div>

            {/* Modals */}
            <FeedbackModal
                isOpen={feedbackOpen}
                appointmentId={feedbackApptId}
                onClose={() => {
                    setFeedbackOpen(false);
                    setFeedbackApptId(null);
                }}
                onSuccess={() => mutate('appointments')}
            />

            <ErrorBoundary name="DashboardModals">
                <Suspense fallback={null}>
                    <HelpRequestModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
                    <WaitlistModal 
                        isOpen={waitlistOpen} 
                        onClose={() => setWaitlistOpen(false)} 
                        providerId={waitlistProviderId} 
                        serviceType={providers.find(p => p.id === waitlistProviderId)?.service_type || ''} 
                    />
                </Suspense>
            </ErrorBoundary>

        </DashboardLayout>
    );
}
