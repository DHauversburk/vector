/**
 * LandingPage - Enterprise portal entry point.
 *
 * @component
 * @description Two-column layout: left panel shows security posture + system
 * status; right panel presents the three role-picker cards. Single-column on
 * mobile. Persistent header carries the live UTC clock and operational status.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Stethoscope,
  Shield,
  ChevronRight,
  HelpCircle,
  Lock,
  CheckCircle2,
  Activity,
  Server,
  Database,
  FileText,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface EntryPoint {
  id: string
  title: string
  subtitle: string
  icon: typeof CreditCard
  gradient: string
  borderColor: string
  ringColor: string
  primary: boolean
  route: string
  badge: string | null
  level: string
}

const entryPoints: EntryPoint[] = [
  {
    id: 'patient',
    title: 'Patient Access',
    subtitle: 'Sign in with your appointment token',
    icon: CreditCard,
    gradient: 'from-blue-600 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-400/60',
    ringColor: 'ring-blue-500/20',
    primary: true,
    route: '/login?mode=patient',
    badge: 'Most patients',
    level: 'L1',
  },
  {
    id: 'provider',
    title: 'Provider Access',
    subtitle: 'Clinical staff authentication',
    icon: Stethoscope,
    gradient: 'from-emerald-600 to-teal-500',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
    ringColor: '',
    primary: false,
    route: '/login?mode=staff',
    badge: null,
    level: 'L2',
  },
  {
    id: 'admin',
    title: 'Administrative Access',
    subtitle: 'System management portal',
    icon: Shield,
    gradient: 'from-purple-600 to-pink-500',
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    ringColor: '',
    primary: false,
    route: '/login?mode=admin',
    badge: null,
    level: 'L3',
  },
]

const securityChecks = [
  { label: 'Zero-Trust Architecture', value: 'ACTIVE' },
  { label: 'End-to-End Encryption', value: 'AES-256-GCM' },
  { label: 'HIPAA Compliance', value: 'VERIFIED' },
  { label: 'SOC 2 Type II', value: 'CURRENT' },
  { label: 'Audit Logging', value: 'ENABLED' },
  { label: 'MFA Enforcement', value: 'REQUIRED' },
]

const systemServices = [
  {
    label: 'Auth Service',
    icon: Lock,
    status: 'ONLINE',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  {
    label: 'Scheduling Engine',
    icon: Server,
    status: 'ONLINE',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  {
    label: 'Clinical DB',
    icon: Database,
    status: 'ONLINE',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  {
    label: 'Audit Log',
    icon: FileText,
    status: 'RECORDING',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
  },
]

const complianceBadges = ['HIPAA', 'SOC 2', 'FIPS 140-2', 'Zero Trust', 'FedRAMP Ready']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const navigate = useNavigate()
  const [utcTime, setUtcTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setUtcTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = utcTime.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = utcTime.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col overflow-hidden">
      {/* ── Top system header ── */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="" aria-hidden="true" className="w-5 h-5 opacity-90" />
          <span className="text-white font-black text-sm tracking-[0.15em] uppercase">VECTOR</span>
          <span className="hidden sm:block text-slate-700 text-xs font-mono">│</span>
          <span className="hidden sm:block text-slate-500 text-xs font-mono">
            Secure Clinical Scheduling System
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* Operational status */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest hidden sm:block">
              All Systems Operational
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest sm:hidden">
              Online
            </span>
          </div>

          {/* Live UTC clock */}
          <div className="text-right hidden md:block">
            <div className="text-xs font-mono font-bold text-slate-300 tabular-nums">{timeStr}</div>
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              UTC · {dateStr}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0" id="main-content">
        {/* ── Left panel: Security posture + system status ── */}
        <aside
          className="hidden lg:flex lg:w-[380px] xl:w-[420px] shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/40 relative overflow-hidden"
          aria-label="System security status"
        >
          {/* Subtle dot-grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #60a5fa 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden="true"
          />
          {/* Left edge accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/40 to-transparent"
            aria-hidden="true"
          />

          <div className="relative flex-1 flex flex-col p-8 gap-8 overflow-y-auto">
            {/* Brand block */}
            <div className="flex flex-col gap-4">
              <div className="relative inline-block w-fit">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-60" />
                <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-xl">
                  <img src="/pwa-192x192.png" alt="VECTOR" className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-[0.15em] text-white uppercase mb-0.5">
                  VECTOR
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Secure Clinical Scheduling System
                </p>
                <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                  Build 2.15.0 · Sprint 15 · Production
                </p>
              </div>
            </div>

            {/* Security posture */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-3 h-3 text-slate-600" aria-hidden="true" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Security Posture
                </span>
              </div>
              <div className="space-y-2.5">
                {securityChecks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-slate-300 truncate">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0 tracking-wider">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800" />

            {/* System services */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3 h-3 text-slate-600" aria-hidden="true" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Service Status
                </span>
              </div>
              <div className="space-y-3">
                {systemServices.map((svc) => {
                  const SvcIcon = svc.icon
                  return (
                    <div key={svc.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SvcIcon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        <span className="text-xs text-slate-400">{svc.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.dot}`} />
                        <span
                          className={`text-[9px] font-mono font-bold ${svc.color} tracking-wider`}
                        >
                          {svc.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">Data Residency</span>
                  <span className="text-[9px] font-mono text-slate-500 tracking-wider">
                    US-GOV-EAST-1
                  </span>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Compliance badges */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-600 mb-3">
                Certifications &amp; Standards
              </p>
              <div className="flex flex-wrap gap-1.5">
                {complianceBadges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-1 text-[8px] font-mono font-bold tracking-widest text-slate-500 border border-slate-800 rounded bg-slate-900/60"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-mono text-slate-700 mt-4 leading-relaxed">
                All access attempts are logged and monitored per HIPAA §164.312 and organizational
                security policy.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Right panel: Role selection ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
          {/* Mobile-only gradient orbs */}
          <div className="absolute inset-0 pointer-events-none lg:hidden" aria-hidden="true">
            <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl bg-blue-600" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-15 blur-3xl bg-purple-600" />
          </div>

          <div className="w-full max-w-md relative">
            {/* Mobile-only brand header */}
            <div className="lg:hidden text-center mb-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <img src="/pwa-192x192.png" alt="" aria-hidden="true" className="w-8 h-8" />
                </div>
              </div>
              <h1 className="text-xl font-black tracking-[0.15em] text-white uppercase mb-1">
                VECTOR
              </h1>
              <p className="text-slate-300 text-sm">Secure clinical scheduling</p>
            </div>

            {/* Section label + heading */}
            <div className="mb-6">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-slate-500 mb-1.5">
                Identity Verification Required
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">
                Select your access level
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Choose the option that matches your role.
              </p>
            </div>

            {/* Role cards */}
            <div className="space-y-3" role="list" aria-label="Access level options">
              {entryPoints.map((entry) => {
                const Icon = entry.icon
                return (
                  <button
                    key={entry.id}
                    role="listitem"
                    onClick={() => navigate(entry.route)}
                    className={`
                      w-full relative flex items-center gap-4 p-4 rounded-xl
                      bg-slate-900/70 backdrop-blur-sm border transition-all duration-150
                      ${entry.borderColor}
                      ${entry.primary ? `ring-1 ${entry.ringColor}` : ''}
                      hover:bg-slate-900 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-px
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                      group
                    `}
                  >
                    {entry.badge && (
                      <span className="absolute -top-2 right-4 px-2 py-0.5 text-[9px] font-mono font-bold bg-blue-600 text-white rounded-full uppercase tracking-wide">
                        {entry.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-white">{entry.title}</span>
                        <span className="text-[8px] font-mono font-bold text-slate-600 border border-slate-700/80 px-1.5 py-px rounded tracking-widest bg-slate-950/50">
                          {entry.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{entry.subtitle}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all"
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>

            {/* Footer row */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => navigate('/login?help=token')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Need help signing in?</span>
              </button>
              <span className="text-[9px] font-mono text-slate-700 text-right hidden sm:block">
                Session will be audited
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
