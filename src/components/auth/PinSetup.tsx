/**
 * PinSetup — first-time PIN creation for new users.
 *
 * Shown after successful authentication when no PIN exists yet.
 * The PIN protects the session on shared or kiosk devices.
 */

import { Shield } from 'lucide-react'
import { TacticalPinField } from '../ui/TacticalPinField'

interface PinSetupProps {
  error: string
  pinLoading: boolean
  onComplete: (pin: string) => void
}

export function PinSetup({ error, pinLoading, onComplete }: PinSetupProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl vector-gradient flex items-center justify-center shadow-lg shadow-indigo-900/40">
          <Shield className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Create your PIN</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Choose any 4-digit PIN. You&rsquo;ll enter it each time you sign in to protect your
          session on shared devices.
        </p>
      </div>

      <TacticalPinField onComplete={onComplete} error={error} loading={pinLoading} />

      <p className="text-center text-[11px] text-slate-600 leading-relaxed">
        Keep your PIN private. Never share it with clinic staff.
        <br />
        You can change it later in Security settings.
      </p>
    </div>
  )
}
