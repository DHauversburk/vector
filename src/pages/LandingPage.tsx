/**
 * LandingPage - Entry point. Pick a sign-in path and go.
 *
 * @component
 * @description First page users see. Three role buttons — patient (primary),
 * provider, admin — plus a help link. No boot sequence, no marketing tiles,
 * no compliance footer. The page should answer "what do I do here?" in one
 * second. (See docs/UX_PERSONA_WALKTHROUGH_2026-04.md for the rationale.)
 */

import { useNavigate } from 'react-router-dom'
import { CreditCard, Stethoscope, Shield, ChevronRight, HelpCircle } from 'lucide-react'

interface EntryPoint {
  id: string
  title: string
  subtitle: string
  icon: typeof CreditCard
  gradient: string
  borderColor: string
  primary: boolean
  route: string
  badge: string | null
}

const entryPoints: EntryPoint[] = [
  {
    id: 'patient',
    title: 'I have an appointment card',
    subtitle: 'Sign in with your token',
    icon: CreditCard,
    gradient: 'from-blue-600 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    primary: true,
    route: '/login?mode=patient',
    badge: 'Most patients',
  },
  {
    id: 'provider',
    title: 'Provider sign-in',
    subtitle: 'Clinical staff',
    icon: Stethoscope,
    gradient: 'from-emerald-600 to-teal-500',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    primary: false,
    route: '/login?mode=staff',
    badge: null,
  },
  {
    id: 'admin',
    title: 'Admin sign-in',
    subtitle: 'System management',
    icon: Shield,
    gradient: 'from-purple-600 to-pink-500',
    borderColor: 'border-purple-500/30 hover:border-purple-400',
    primary: false,
    route: '/login?mode=admin',
    badge: null,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen min-h-[100dvh] relative flex flex-col items-center justify-center p-6 bg-slate-950 overscroll-none overflow-y-auto">
      {/* Background — minimal: gradient orbs only, no scan lines, no grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-30 blur-3xl bg-blue-600" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-purple-600" />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Logo + brand */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50" />
            <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl">
              <img src="/pwa-192x192.png" alt="" aria-hidden="true" className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            VECTOR
          </h1>
          <p className="text-slate-300 text-sm">Secure clinical scheduling</p>
        </div>

        {/* Three sign-in paths */}
        <div className="space-y-3">
          {entryPoints.map((entry) => {
            const Icon = entry.icon
            return (
              <button
                key={entry.id}
                onClick={() => navigate(entry.route)}
                className={`
                  w-full relative flex items-center gap-4 p-4 rounded-xl
                  bg-slate-900/80 backdrop-blur-sm border transition-all duration-150
                  ${entry.borderColor}
                  ${entry.primary ? 'ring-1 ring-blue-500/20' : ''}
                  hover:bg-slate-900 hover:shadow-lg
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                `}
              >
                {entry.badge && (
                  <span className="absolute -top-2 right-4 px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded-full">
                    {entry.badge}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h2 className="text-base font-semibold text-white">{entry.title}</h2>
                  <p className="text-xs text-slate-300">{entry.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        {/* Help link — single line, plain English */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/login?help=token')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            <span>Need help signing in?</span>
          </button>
        </div>
      </div>
    </div>
  )
}
