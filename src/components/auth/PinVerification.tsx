/**
 * PinVerification — prompts the user to enter their 4-digit PIN.
 *
 * Shows attempt feedback through the `error` prop passed from LoginPage.
 * After 3 failed attempts the parent should initiate a reset flow.
 */

import { Shield, KeyRound } from 'lucide-react'
import { TacticalPinField } from '../ui/TacticalPinField'

interface PinVerificationProps {
  error: string
  pinLoading: boolean
  onComplete: (pin: string) => void
  /** Number of failed attempts so far — used for escalating UX hints */
  attemptCount?: number
}

export function PinVerification({
  error,
  pinLoading,
  onComplete,
  attemptCount = 0,
}: PinVerificationProps) {
  const showEscalation = attemptCount >= 2

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Enter your PIN</h2>
        <p className="text-sm text-slate-400">
          {showEscalation
            ? 'Having trouble? Contact your administrator for a PIN reset.'
            : 'Enter the 4-digit PIN you set up when you first signed in.'}
        </p>
      </div>

      <TacticalPinField onComplete={onComplete} error={error} loading={pinLoading} />

      {/* Hint for users who may have forgotten their PIN */}
      {!error && !showEscalation && (
        <p className="text-center text-[11px] text-slate-600">
          <KeyRound className="w-3 h-3 inline mr-1" aria-hidden="true" />
          Forgot your PIN? Ask your administrator for a reset.
        </p>
      )}
    </div>
  )
}
