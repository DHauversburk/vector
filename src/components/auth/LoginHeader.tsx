import { Lock } from 'lucide-react'
import { LoadingPlaceholder } from './AuthForm'

interface LoginHeaderProps {
  stage: 'auth' | 'pin' | 'setup' | 'reset'
  isLoaded: (id: string) => boolean
  isLoading: (id: string) => boolean
  currentLoadingText: string
}

export function LoginHeader({ stage, isLoaded, isLoading, currentLoadingText }: LoginHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="relative inline-block mb-6 h-24">
        {/* Loading state */}
        {isLoading('logo') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingPlaceholder text={currentLoadingText} visible={true} />
          </div>
        )}

        {/* Loaded state */}
        <div
          className={`transition-all duration-700 ${isLoaded('logo') ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        >
          <div
            className="absolute inset-0 vector-gradient rounded-2xl blur-xl opacity-50 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <div className="relative w-20 h-20 mx-auto rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center shadow-2xl">
            {stage === 'auth' ? (
              <img
                src="/pwa-192x192.png"
                alt=""
                aria-hidden="true"
                className="w-12 h-12 drop-shadow-lg"
              />
            ) : (
              <Lock className="w-10 h-10 text-blue-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="h-16 relative">
        {/* Loading state */}
        {isLoading('title') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingPlaceholder text={currentLoadingText} visible={true} />
          </div>
        )}

        {/* Loaded state */}
        <div
          className={`transition-all duration-700 ${isLoaded('title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <h1 className="text-3xl font-black tracking-[0.2em] uppercase mb-2 vector-gradient-text">
            VECTOR
          </h1>
          <p className="text-sm text-slate-400">
            {stage === 'auth'
              ? 'Sign in to your account'
              : stage === 'pin'
                ? 'Enter your PIN'
                : 'Set up your PIN'}
          </p>
        </div>
      </div>
    </div>
  )
}
