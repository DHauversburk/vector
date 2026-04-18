/**
 * LandingPage - Entry point.
 *
 * Visual hierarchy: patient (primary hero) > provider > admin.
 * Most users are patients — they get the largest, most prominent action.
 * Provider and admin are clearly secondary. No infrastructure noise.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Stethoscope, Shield, ChevronRight, HelpCircle } from 'lucide-react'

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
      {/* Slim header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="" aria-hidden="true" className="w-5 h-5" />
          <span className="text-white font-black text-sm tracking-[0.12em] uppercase">VECTOR</span>
          <span className="hidden sm:block text-slate-700 text-xs">│</span>
          <span className="hidden sm:block text-slate-600 text-[11px] font-mono tracking-wide">
            Secure Clinical Scheduling
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
              Operational
            </span>
          </div>
          <span className="hidden md:block text-[11px] font-mono text-slate-600 tabular-nums">
            {clockStr} UTC
          </span>
        </div>
      </header>

      {/* Main */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-10">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-40" />
              <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img src="/pwa-192x192.png" alt="VECTOR" className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-[0.1em] text-white uppercase mb-1.5">
              VECTOR
            </h1>
            <p className="text-slate-500 text-sm">Select how you're signing in.</p>
          </div>

          {/* ── PRIMARY: Patient ── */}
          <button
            onClick={() => navigate('/login?mode=patient')}
            className="
              group w-full relative mb-3 p-5 rounded-2xl text-left
              bg-gradient-to-br from-blue-600/10 to-cyan-600/5
              border border-blue-500/20 hover:border-blue-400/50
              hover:from-blue-600/15 hover:to-cyan-600/10
              hover:-translate-y-px hover:shadow-xl hover:shadow-blue-900/30
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
            "
          >
            {/* "Most patients" badge */}
            <span className="absolute -top-2 right-5 px-2.5 py-0.5 text-[9px] font-mono font-bold bg-blue-600 text-white rounded-full uppercase tracking-widest">
              Most patients
            </span>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
                <CreditCard className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white mb-0.5">I have an appointment</p>
                <p className="text-sm text-slate-400">Sign in with your appointment token</p>
              </div>
              <ChevronRight
                className="w-5 h-5 text-slate-600 shrink-0 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200"
                aria-hidden="true"
              />
            </div>
          </button>

          {/* ── SECONDARY: Provider + Admin ── */}
          <div className="space-y-2">
            {[
              {
                id: 'provider',
                label: 'Provider sign-in',
                sub: 'Clinical staff',
                Icon: Stethoscope,
                route: '/login?mode=staff',
                accent: 'hover:border-emerald-500/40 hover:text-emerald-400',
                iconAccent: 'group-hover:text-emerald-400',
              },
              {
                id: 'admin',
                label: 'Admin sign-in',
                sub: 'System management',
                Icon: Shield,
                route: '/login?mode=admin',
                accent: 'hover:border-purple-500/40 hover:text-purple-400',
                iconAccent: 'group-hover:text-purple-400',
              },
            ].map(({ id, label, sub, Icon, route, accent, iconAccent }) => (
              <button
                key={id}
                onClick={() => navigate(route)}
                className={`
                  group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left
                  bg-slate-900/40 border border-slate-800
                  hover:bg-slate-900/70 hover:-translate-y-px
                  transition-all duration-200
                  ${accent}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                `}
              >
                <Icon
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-colors ${iconAccent}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {label}
                  </span>
                  <span className="text-slate-600 text-xs ml-2">{sub}</span>
                </div>
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-700 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login?help=token')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
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
