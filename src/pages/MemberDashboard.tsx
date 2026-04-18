import { useState, lazy, Suspense } from 'react'
import { useMemberDashboard } from '../hooks/useMemberDashboard'
import { format, parseISO } from 'date-fns'
import { Loader2, Clock, Shield, Activity, FileText, BellPlus, ArrowRight } from 'lucide-react'
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout'
import { WelcomeModal } from '../components/onboarding/WelcomeModal'
import { Card, CardContent, CardDescription } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { AppointmentRow } from '../components/member/AppointmentTimeline'
import { FeedbackModal } from '../components/member/FeedbackModal'
import { BookingConsole } from '../components/member/BookingConsole'

// --- LAZY-LOADED COMPONENTS ---
const SecuritySettings = lazy(() =>
  import('../components/SecuritySettings').then((m) => ({ default: m.SecuritySettings })),
)
const PatientResourcesView = lazy(() =>
  import('../components/member/PatientResourcesView').then((m) => ({
    default: m.PatientResourcesView,
  })),
)
const HelpRequestModal = lazy(() =>
  import('../components/ui/HelpRequestModal').then((m) => ({ default: m.HelpRequestModal })),
)
const WaitlistModal = lazy(() =>
  import('../components/ui/WaitlistModal').then((m) => ({ default: m.WaitlistModal })),
)

/**
 * Feature-level loading fallback
 */
const FeatureLoading = () => (
  <div className="w-full flex justify-center py-12">
    <LoadingState message="ACCESSING MEDICAL DATA..." />
  </div>
)

export default function MemberDashboard() {
  const {
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
  } = useMemberDashboard()

  const [appointView, setAppointView] = useState<'upcoming' | 'history'>('upcoming')

  // Helper to determine location based on team/service
  const getProviderLocation = (serviceType?: string) => {
    const t = (serviceType || '').toUpperCase()
    if (t.includes('GREEN') || t.includes('MH')) return 'Mental Health Clinic — Bldg 210'
    if (t.includes('BLUE') || t.includes('PT')) return 'Rehab Center — Wing C'
    if (t.includes('RED') || t.includes('MED') || t.includes('FAMILY'))
      return 'Primary Care — Bldg 1'
    return 'Main Clinic Front Desk'
  }

  const navItems: NavItem[] = [
    {
      id: 'ops',
      label: 'My Care',
      icon: Activity,
      onClick: () => setActiveTab('ops'),
      dataTour: 'nav-overview',
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: FileText,
      onClick: () => setActiveTab('resources'),
    },
    { id: 'security', label: 'Security', icon: Shield, onClick: () => setActiveTab('security') },
  ]

  if (loading && appointments.length === 0)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Syncing My Care Profile...
          </span>
        </div>
      </div>
    )

  const upcomingAppts = appointments
    .filter((a) => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const nextAppt = upcomingAppts[0]

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      user={user}
      role="Member"
      onSignOut={signOut}
      title="Member Dashboard"
    >
      <WelcomeModal role="member" userName={user?.user_metadata?.token_alias || user?.email} />
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 pb-20">
        {activeTab === 'ops' && (
          <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
            <header data-tour="dashboard-title">
              <h2 className="md:hidden text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Activities
              </h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-2 md:mt-0">
                Manage your care and appointments securely
              </p>
            </header>

            {/* Upcoming Session Countdown */}
            {nextAppt && (
              <Card
                variant="default"
                className="bg-slate-900 border border-indigo-500/20 shadow-xl overflow-hidden group"
              >
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 md:p-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Clock className="w-10 h-10 text-indigo-300" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">
                        Upcoming appointment
                      </p>
                      <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                        {format(parseISO(nextAppt.start_time), 'EEEE, MMMM do')}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black uppercase text-indigo-200">
                          {format(parseISO(nextAppt.start_time), 'HH:mm')}
                        </div>
                        <span className="text-slate-500 text-xs">•</span>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-tight">
                          {nextAppt.notes
                            ?.split('|')
                            .find((s: string) => s.trim().startsWith('Location:'))
                            ?.replace('Location:', '')
                            .trim() || getProviderLocation(nextAppt.provider?.service_type)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-6">
                <section>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                      <button
                        onClick={() => setAppointView('upcoming')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${appointView === 'upcoming' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setAppointView('history')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${appointView === 'history' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Past
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ErrorBoundary name="AppointmentTimeline">
                      {appointView === 'upcoming' ? (
                        upcomingAppts.length > 0 ? (
                          upcomingAppts.map((appt) => (
                            <AppointmentRow
                              key={appt.id}
                              appt={appt}
                              getProviderLocation={getProviderLocation}
                              onReschedule={startReschedule}
                              onCancel={handleCancel}
                              onFeedback={(id: string) => {
                                setFeedbackApptId(id)
                                setFeedbackOpen(true)
                              }}
                            />
                          ))
                        ) : (
                          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <BellPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                              No upcoming appointments
                            </p>
                          </div>
                        )
                      ) : appointments.filter(
                          (a) => new Date(a.start_time) < new Date() || a.status === 'cancelled',
                        ).length > 0 ? (
                        appointments
                          .filter(
                            (a) => new Date(a.start_time) < new Date() || a.status === 'cancelled',
                          )
                          .sort(
                            (a, b) =>
                              new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
                          )
                          .slice(0, 10)
                          .map((appt) => (
                            <AppointmentRow
                              key={appt.id}
                              appt={appt}
                              getProviderLocation={getProviderLocation}
                              onReschedule={startReschedule}
                              onCancel={handleCancel}
                              onFeedback={(id: string) => {
                                setFeedbackApptId(id)
                                setFeedbackOpen(true)
                              }}
                            />
                          ))
                      ) : (
                        <p className="text-center py-10 text-slate-500 text-xs">
                          No past appointments
                        </p>
                      )}
                    </ErrorBoundary>
                  </div>
                </section>
              </div>

              <div className="md:col-span-4 h-fit sticky top-24">
                <ErrorBoundary name="MemberSidebar">
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/10 border border-indigo-500/20">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">
                        Quick actions
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setBookingOpen(true)}
                          className="w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">
                            Book appointment
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                          onClick={() => setHelpModalOpen(true)}
                          className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">
                            Help Center
                          </span>
                          <p className="text-[10px] font-bold text-slate-500">24/7 SUPPORT</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <Suspense fallback={<FeatureLoading />}>
            <PatientResourcesView />
          </Suspense>
        )}

        {activeTab === 'security' && (
          <Suspense fallback={<FeatureLoading />}>
            <SecuritySettings />
          </Suspense>
        )}
      </div>

      {/* Feature Modals */}
      {bookingOpen && (
        <BookingConsole
          providers={providers}
          appointments={appointments}
          myWaitlist={myWaitlist}
          onBookingComplete={handleBookingComplete}
          onCancelReschedule={cancelReschedule}
          onRequestWaitlist={(providerId) => {
            setWaitlistProviderId(providerId)
            setWaitlistOpen(true)
          }}
          apptToReschedule={apptToReschedule}
          isRescheduling={isRescheduling}
        />
      )}

      <Suspense fallback={null}>
        {helpModalOpen && (
          <HelpRequestModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
        )}
        {waitlistOpen && (
          <WaitlistModal
            isOpen={waitlistOpen}
            onClose={() => setWaitlistOpen(false)}
            providerId={waitlistProviderId}
            serviceType={
              providers.find((p) => p.id === waitlistProviderId)?.service_type || 'General'
            }
          />
        )}
        {feedbackOpen && feedbackApptId && (
          <FeedbackModal
            isOpen={feedbackOpen}
            onClose={() => {
              setFeedbackOpen(false)
              setFeedbackApptId(null)
            }}
            appointmentId={feedbackApptId}
          />
        )}
      </Suspense>
    </DashboardLayout>
  )
}
