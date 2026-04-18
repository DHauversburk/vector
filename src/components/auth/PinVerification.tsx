import { Shield } from 'lucide-react'
import { TacticalPinField } from '../ui/TacticalPinField'

interface PinVerificationProps {
  error: string
  pinLoading: boolean
  onComplete: (pin: string) => void
}

export function PinVerification({ error, pinLoading, onComplete }: PinVerificationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
        <h2 className="text-xl font-semibold text-white mb-2">Enter your PIN</h2>
        <p className="text-sm text-slate-300">Use the 4-digit PIN you created.</p>
      </div>
      <TacticalPinField onComplete={onComplete} error={error} loading={pinLoading} />
    </div>
  )
}
