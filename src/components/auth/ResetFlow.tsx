import { useId } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ResetFlowProps {
  error: string
  handleReset: (token: string) => void
  onCancel: () => void
}

export function ResetFlow({ error, handleReset, onCancel }: ResetFlowProps) {
  const inputId = useId()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="text-xs font-black uppercase tracking-widest text-slate-300"
        >
          Administrative Reset Token
        </label>
        <Input
          id={inputId}
          autoFocus
          placeholder="Enter Reset Code"
          className="h-12 bg-slate-950/50 border-slate-700 text-white"
          onChange={(e) => {
            if (e.target.value.length >= 4) handleReset(e.target.value)
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400 font-bold uppercase">
          {error}
        </p>
      )}
      <Button
        onClick={onCancel}
        variant="ghost"
        className="w-full text-slate-300 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
      >
        Cancel Reset
      </Button>
    </div>
  )
}
