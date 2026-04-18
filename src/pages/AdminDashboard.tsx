import { useAdminDashboard, type ActionContext } from '../hooks/useAdminDashboard'
import {
  Activity,
  FileText,
  Grid,
  AlertCircle,
  Database,
  Lock,
  ChevronDown,
  MessageSquare,
} from 'lucide-react'
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import TokenGenerator from '../components/admin/TokenGenerator'
import MasterSchedule from '../components/admin/MasterSchedule'
import { SystemMaintenance } from '../components/admin/SystemMaintenance'
import AuditLogViewer from '../components/admin/AuditLogViewer'
import { FeedbackViewer } from '../components/admin/FeedbackViewer'
import { WelcomeModal } from '../components/onboarding/WelcomeModal'

export default function AdminDashboard() {
  const { user } = useAuth()
  const {
    signOut,
    actionContext,
    setActionContext,
    currentView,
    setCurrentView,
    isContextOpen,
    setIsContextOpen,
    toggleContext,
    stats,
  } = useAdminDashboard()

  const navItems: NavItem[] = [
    { id: 'schedule', label: 'Schedule', icon: Grid, onClick: () => setCurrentView('schedule') },
    { id: 'tokens', label: 'Tokens', icon: FileText, onClick: () => setCurrentView('tokens') },
    { id: 'logs', label: 'Audit Logs', icon: AlertCircle, onClick: () => setCurrentView('logs') },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Database,
      onClick: () => setCurrentView('maintenance'),
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: MessageSquare,
      onClick: () => setCurrentView('feedback'),
    },
  ]

  // Action context switcher lives in the header's right slot
  const contextSwitcher = (
    <div className="relative">
      <button
        onClick={toggleContext}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-black tracking-widest transition-all ${
          actionContext === 'block'
            ? 'bg-red-950/50 border-red-900/50 text-red-400 hover:bg-red-950/70'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isContextOpen}
      >
        <span className="uppercase">{actionContext} Mode</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isContextOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isContextOpen && (
        <>
          {/* Click-outside dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsContextOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-1">
              <p className="px-3 py-1.5 text-[9px] text-slate-500 font-black uppercase tracking-widest">
                Control Context
              </p>
              <button
                onClick={() => {
                  setActionContext('view' as ActionContext)
                  setIsContextOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-white">Monitor</p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Observation &amp; analytics only.
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setActionContext('block' as ActionContext)
                  setIsContextOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-950/30 rounded-lg text-left transition-colors"
              >
                <Lock className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-white">Restricted</p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Modify slots and access.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={currentView}
      user={user}
      role="Administrator"
      onSignOut={signOut}
      title="Admin Console"
      headerActions={contextSwitcher}
    >
      <WelcomeModal role="admin" userName="System Administrator" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-2 pb-4 md:pt-4 md:pb-6 space-y-4 md:space-y-6">
        {/* System health strip */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Total Users
            </span>
            <span className="text-xs font-black text-indigo-400 font-mono tabular-nums">
              {stats.total_users || '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Active Visits
            </span>
            <span className="text-xs font-black text-emerald-400 font-mono tabular-nums">
              {stats.active_appointments ?? 0}
            </span>
          </div>
        </div>

        {/* Active view */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentView === 'schedule' && <MasterSchedule actionContext={actionContext} />}
          {currentView === 'tokens' && <TokenGenerator />}
          {currentView === 'logs' && <AuditLogViewer />}
          {currentView === 'maintenance' && <SystemMaintenance />}
          {currentView === 'feedback' && <FeedbackViewer />}
        </div>
      </div>
    </DashboardLayout>
  )
}
