import React, { useRef, useState, useEffect } from 'react'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TacticalPinFieldProps {
  onComplete: (pin: string) => void
  error?: string
  loading?: boolean
}

export const TacticalPinField: React.FC<TacticalPinFieldProps> = ({
  onComplete,
  error,
  loading,
}) => {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync value and trigger completion
  useEffect(() => {
    if (value.length === 4) {
      onComplete(value)
    }
  }, [value, onComplete])

  // Handle focus
  const handleBoxClick = () => {
    if (!loading) {
      inputRef.current?.focus()
    }
  }

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 500)
    return () => clearTimeout(timer)
  }, [])

  // Clear on error
  useEffect(() => {
    if (error) {
      setValue('')
      inputRef.current?.focus()
    }
  }, [error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setValue(val)
  }

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="relative" onClick={handleBoxClick}>
        {/* Hidden Real Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={loading}
          className="absolute inset-0 opacity-0 cursor-default pointer-events-none"
          aria-label="Security PIN"
          aria-invalid={!!error}
          aria-describedby={error ? 'pin-field-error' : undefined}
        />

        {/* Visual Boxes */}
        <div className="flex justify-center gap-3" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => {
            const digit = value[i]
            const isActive = isFocused && (value.length === i || (value.length === 4 && i === 3))

            return (
              <div key={i} className="relative">
                {/* Glow effect for active box */}
                {isActive && (
                  <div className="absolute -inset-1 vector-gradient rounded-xl blur opacity-40 animate-pulse" />
                )}
                <div
                  className={cn(
                    'relative w-14 h-16 flex items-center justify-center text-3xl font-black rounded-xl border-2 transition-all duration-200 bg-slate-950/80 backdrop-blur-sm shadow-inner',
                    error
                      ? 'border-red-500 text-red-400'
                      : digit
                        ? 'border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20'
                        : isActive
                          ? 'border-blue-400 shadow-lg shadow-blue-500/30'
                          : 'border-slate-700 text-white',
                  )}
                >
                  {digit ? '•' : ''}
                  {isActive && value.length === i && (
                    <div className="absolute w-0.5 h-8 bg-blue-400 animate-pulse" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              value.length > i
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                : 'bg-slate-700',
            )}
          />
        ))}
      </div>

      {/* Status Messages */}
      <div className="min-h-[20px] flex flex-col items-center justify-center gap-2">
        {error && (
          <div
            id="pin-field-error"
            role="alert"
            className="flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-1 duration-300"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-xs font-black uppercase text-blue-400 tracking-widest">
              {error ? 'Retrying...' : 'Verifying...'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
