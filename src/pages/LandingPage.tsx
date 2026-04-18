/**
 * LandingPage - Entry point. Pick a role, sign in. Done.
 *
 * @component
 * @description Three role cards on a clean dark surface. No boot sequence,
 * no compliance panels — just fast, confident role selection. Header carries
 * operational status + live UTC clock for staff context.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Stethoscope, Shield, ChevronRight, HelpCircle } from 'lucide-react'

interface EntryPoint {
  id: string
  title: string
  subtitle: string
  icon: typeof CreditCard
  gradient: string
  border: string
  glow: string
  primary: boolean
  route: string
  badge: string | null
}

const entryPoints: EntryPoint[] = [
  {
    id: 'patient',
    title: 'I have an appointment',
    subtitle: 'Sign in with your appointment token',
    icon: CreditCard,
    gradient: 'from-blue-600 to-cyan-500',
    border: 'border-blue-500/25 hover:border-blue-400/50',
    glow: 'group-hover:shadow-blue-900/40',
    primary: true,
    route: '/login?mode=patient',
    badge: 'Most patients',
  },
  {
    id: 'provider',
    title: 'Provider sign-in',
    subtitle: 'Clinical staff — email or badge',
    icon: Stethoscope,
    gradient: 'from-emerald-600 to-teal-500',
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    glow: 'group-hover:shadow-emerald-900/40',
    primary: false,
    route: '/login?mode=staff',
    badge: null,
  },
  {
    id: 'admin',
    title: 'Admin sign-in',
    subtitle: 'System and facility management',
    icon: Shield,
    gradient: 'from-purple-600 to-pink-500',
    border: 'border-purple-500/25 hover:border-purple-400/50',
    glow: 'group-hover:shadow-purple-900/40',
    primary: false,
    route: '/login?mode=admin',
    badge: null,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [utcTime, setUtcTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setUtcTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clockStr = utcTime.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col">
      {/* ── Slim system header ── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-2.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="" aria-hidden="true" className="w-5 h-5" />
          <span className="text-white font-black text-sm tracking-[0.12em] uppercase">VECTOR</span>
          <span className="hidden sm:block text-slate-700 text-xs">│</span>
          <span className="hidden sm:block text-slate-500 text-[11px] font-mono">
            Secure Clinical Scheduling
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
              Operational
            </span>
          </div>
          <span className="hidden md:block text-xs font-mono text-slate-500 tabular-nums">
            {clockStr} <span className="text-slate-700">UTC</span>
          </span>
        </div>
      </header>

      {/* ── Main: centered role picker ── */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 -translate-y-1/2 rounded-full opacity-10 blur-3xl bg-blue-600" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 translate-y-1/2 rounded-full opacity-8 blur-3xl bg-purple-600" />
        </div>

        <div className="w-full max-w-sm relative">
          {/* Brand mark */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-2xl">
                <img src="/pwa-192x192.png" alt="VECTOR" className="w-9 h-9" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-[0.12em] text-white uppercase mb-2">
              VECTOR
            </h1>
            <p className="text-sm text-slate-400">How are you signing in today?</p>
          </div>

          {/* Role cards */}
          <div className="space-y-2.5">
            {entryPoints.map((entry) => {
              const Icon = entry.icon
              return (
                <button
                  key={entry.id}
                  onClick={() => navigate(entry.route)}
                  className={`
                    group w-full relative flex items-center gap-4 px-4 py-3.5 rounded-xl
                    bg-slate-900/60 border backdrop-blur-sm
                    transition-all duration-200
                    ${entry.border}
                    ${entry.primary ? 'ring-1 ring-blue-500/15' : ''}
                    hover:bg-slate-900 hover:-translate-y-px
                    hover:shadow-xl ${entry.glow}
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
                  `}
                >
                  {entry.badge && (
                    <span className="absolute -top-2 right-4 px-2 py-px text-[9px] font-mono font-bold bg-blue-600 text-white rounded-full uppercase tracking-wide">
                      {entry.badge}
                    </span>
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center shrink-0 shadow-lg`}
                  >
                    <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" aria-hidden="true" />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">{entry.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.subtitle}</p>
                  </div>

                  <ChevronRight
                    className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-200"
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          {/* Help link */}
          <div className="mt-7 text-center">
            <button
              onClick={() => navigate('/login?help=token')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Need help signing in?</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
