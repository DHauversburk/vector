/**
 * LandingPage - Role selection portal.
 *
 * Intentionally mirrors the LoginPage split layout so both pages feel like
 * one continuous flow: pick a role here → authenticate there.
 * No boot sequence needed — background is always fully visible.
 */

import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Stethoscope,
  Shield,
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  ClipboardList,
  HelpCircle,
} from 'lucide-react'
import { LoginBackground } from '../components/auth/LoginBackground'

// LoginBackground was designed for the auth flow but works perfectly as a
// shared shell. We pass isLoaded as always-true since there's no boot
// sequence on this page — everything renders immediately.
const alwaysLoaded = () => true

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <LoginBackground isLoaded={alwaysLoaded}>
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* ── LEFT PANEL — brand context, desktop only ── */}
        <div className="hidden md:flex md:flex-col md:w-1/2 lg:w-3/5 items-center justify-center p-12">
          <div className="max-w-md w-full">
            {/* Wordmark */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl vector-gradient flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl" aria-hidden="true">
                  V
                </span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">VECTOR</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Secure clinical
              <br />
              scheduling
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Enterprise healthcare coordination for providers, members, and care teams.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4" aria-label="Platform capabilities">
              {[
                { Icon: ShieldCheck, label: 'Role-based access with PIN protection' },
                { Icon: CalendarCheck, label: 'Real-time appointment management' },
                { Icon: ClipboardList, label: 'HIPAA-aligned audit trail' },
              ].map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-slate-300">
                  <Icon className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT PANEL — role selection ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
          {/* Mobile wordmark — hidden on desktop where left panel shows it */}
          <div className="md:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl vector-gradient flex items-center justify-center shadow-lg mx-auto mb-4">
              <span className="text-white font-bold text-xl" aria-hidden="true">
                V
              </span>
            </div>
            <p className="text-2xl font-bold text-white">VECTOR</p>
            <p className="text-slate-400 text-sm mt-1">Secure clinical scheduling</p>
          </div>

          {/* Role selection card — same visual treatment as the login card */}
          <div className="w-full max-w-sm">
            <div className="relative">
              <div className="absolute -inset-1 vector-gradient rounded-3xl blur-lg opacity-20" />
              <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="mb-6">
                  <h2 className="text-base font-bold text-white mb-1">Sign in to VECTOR</h2>
                  <p className="text-sm text-slate-400">Select your access role to continue.</p>
                </div>

                <nav aria-label="Access role selection">
                  <ul className="space-y-3">
                    {/* ── Patient — primary action ── */}
                    <li>
                      <button
                        onClick={() => navigate('/login?mode=patient')}
                        className="group w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-600/15 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">
                              I have an appointment
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              Most patients
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Sign in with your appointment token
                          </p>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200"
                          aria-hidden="true"
                        />
                      </button>
                    </li>

                    {/* ── Provider ── */}
                    <li>
                      <button
                        onClick={() => navigate('/login?mode=staff')}
                        className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Stethoscope
                            className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                            Provider sign-in
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Clinical staff authentication
                          </p>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200"
                          aria-hidden="true"
                        />
                      </button>
                    </li>

                    {/* ── Admin ── */}
                    <li>
                      <button
                        onClick={() => navigate('/login?mode=admin')}
                        className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Shield
                            className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                            Admin sign-in
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">System management portal</p>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Help link */}
                <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                  <button
                    onClick={() => navigate('/login?help=token')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Need help signing in?</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoginBackground>
  )
}
