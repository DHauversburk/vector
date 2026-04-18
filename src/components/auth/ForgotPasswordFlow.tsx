/**
 * ForgotPasswordFlow — Email-based password reset via Supabase.
 *
 * Shown on LoginPage when user clicks "Forgot password?". Sends a reset
 * email then shows a success/instruction state. Applies only to staff and
 * admin accounts (email-based login). Token/patient users recover via an
 * admin-issued token reset.
 */

import { useState, useId } from 'react'
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { supabase } from '../../lib/supabase'

interface ForgotPasswordFlowProps {
  onCancel: () => void
}

export function ForgotPasswordFlow({ onCancel }: ForgotPasswordFlowProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const emailId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      })

      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      const e = err as { message: string }
      // Don't leak whether the email exists — always show a generic message
      // on user-not-found errors to prevent account enumeration.
      if (
        e.message?.toLowerCase().includes('not found') ||
        e.message?.toLowerCase().includes('invalid')
      ) {
        setSent(true) // show success anyway for security
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-400" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white">Check your inbox</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            If <span className="text-slate-200 font-medium">{email}</span> is registered, you'll
            receive a password reset link shortly.
          </p>
          <p className="text-xs text-slate-500">
            No email? Check your spam folder, or contact your system administrator.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white">Reset your password</h3>
        <p className="text-sm text-slate-400">
          Enter the email address linked to your staff or admin account. We'll send you a reset
          link.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor={emailId}
            className="text-xs font-bold text-slate-400 uppercase tracking-widest"
          >
            Email address
          </label>
          <div className="relative">
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              className="h-11 text-sm pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
            />
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          isLoading={loading}
        >
          {loading ? 'Sending reset link…' : 'Send reset link'}
        </Button>
      </form>

      <div className="pt-1 text-center">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to sign in
        </button>
      </div>
    </div>
  )
}
