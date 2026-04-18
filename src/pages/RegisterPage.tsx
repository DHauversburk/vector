/**
 * RegisterPage — Self-registration for new VECTOR users.
 *
 * Mirrors the LoginPage/LandingPage split layout (LoginBackground shell,
 * left brand panel, right glassmorphism card) so the entire auth flow
 * feels like one continuous product.
 *
 * Note: In most deployments, accounts are provisioned by admins via
 * TokenGenerator. This page handles edge-case self-registration.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  ShieldCheck,
  CalendarCheck,
  ClipboardList,
  User,
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LoginBackground } from '../components/auth/LoginBackground'

const alwaysLoaded = () => true

export default function RegisterPage() {
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('Your security PIN must be exactly 4 digits.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            token_alias: alias.toUpperCase(),
            tactical_pin: pin,
            role: 'member',
          },
        },
      })

      if (signUpError) throw signUpError

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const e = err as { message: string }
      setError(e.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginBackground isLoaded={alwaysLoaded}>
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* ── LEFT PANEL — brand context, desktop only ── */}
        <div className="hidden md:flex md:flex-col md:w-1/2 lg:w-3/5 items-center justify-center p-12">
          <div className="max-w-md w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl vector-gradient flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl" aria-hidden="true">
                  V
                </span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">VECTOR</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Create your
              <br />
              account
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Join the VECTOR platform to schedule and manage your clinical appointments securely.
            </p>

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

        {/* ── RIGHT PANEL — registration form ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
          {/* Mobile wordmark */}
          <div className="md:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl vector-gradient flex items-center justify-center shadow-lg mx-auto mb-4">
              <span className="text-white font-bold text-xl" aria-hidden="true">
                V
              </span>
            </div>
            <p className="text-2xl font-bold text-white">VECTOR</p>
            <p className="text-slate-400 text-sm mt-1">Secure clinical scheduling</p>
          </div>

          <div className="w-full max-w-sm">
            <div className="relative">
              <div className="absolute -inset-1 vector-gradient rounded-3xl blur-lg opacity-20" />
              <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                {success ? (
                  /* Success state */
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-7 h-7 text-emerald-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white mb-1">Account created</h2>
                      <p className="text-sm text-slate-400">
                        Check your email to confirm your address. Redirecting to sign-in…
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-base font-bold text-white mb-1">Create account</h2>
                      <p className="text-sm text-slate-400">
                        Already have a token?{' '}
                        <Link
                          to="/login?mode=patient"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Sign in here
                        </Link>
                      </p>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-5 text-sm text-red-400"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4" noValidate>
                      {/* Alias + PIN row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="alias"
                            className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                          >
                            Alias
                          </label>
                          <div className="relative">
                            <Input
                              id="alias"
                              placeholder="GHOST-01"
                              value={alias}
                              onChange={(e) => setAlias(e.target.value.toUpperCase())}
                              required
                              aria-required="true"
                              className="h-10 text-xs font-bold uppercase pl-8 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                            />
                            <User
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                              aria-hidden="true"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="pin"
                            className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                          >
                            4-digit PIN
                          </label>
                          <div className="relative">
                            <Input
                              id="pin"
                              type="password"
                              inputMode="numeric"
                              placeholder="••••"
                              maxLength={4}
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                              required
                              aria-required="true"
                              aria-describedby="pin-hint"
                              className="h-10 text-xs font-bold pl-8 bg-slate-800/50 border-slate-700 text-white tracking-[0.4em] placeholder:text-slate-600 focus:border-blue-500/50"
                            />
                            <Lock
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                              aria-hidden="true"
                            />
                          </div>
                          <p id="pin-hint" className="text-[10px] text-slate-600">
                            You'll enter this on every sign-in.
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="email"
                          className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                        >
                          Email address
                        </label>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-required="true"
                            className="h-10 text-sm pl-8 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                          />
                          <Mail
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="password"
                          className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-required="true"
                            className="h-10 text-sm pl-8 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                          />
                          <Lock
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 vector-gradient text-white font-bold text-sm tracking-wide shadow-lg"
                        isLoading={loading}
                      >
                        {loading ? 'Creating account…' : 'Create account'}
                      </Button>
                    </form>

                    {/* Back link */}
                    <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                      <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        Back to role selection
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoginBackground>
  )
}
