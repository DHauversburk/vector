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
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full vector-gradient flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Set up your PIN</h2>
        <p className="text-sm text-slate-400">
          Choose a 4-digit PIN. You&rsquo;ll use it to sign in next time.
        </p>
      </div>
      <TacticalPinField onComplete={onComplete} error={error} loading={pinLoading} />
    </div>
  )
}
