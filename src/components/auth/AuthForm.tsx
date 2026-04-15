import React, { useId } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'
import {
  QrCode,
  Mail,
  Key,
  ShieldCheck,
  Fingerprint,
  Shield,
  Zap,
  HelpCircle,
  Loader2,
} from 'lucide-react'

export const LoadingPlaceholder = ({ text, visible }: { text: string; visible: boolean }) => (
  <div
    className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
  >
    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" aria-hidden="true" />
    <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{text}</span>
  </div>
)

interface AuthFormProps {
  mode: 'token' | 'email'
  setMode: (mode: 'token' | 'email') => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  token: string
  setToken: (v: string) => void
  handleLogin: (e: React.FormEvent) => void
  handleBiometric: () => void
  loading: boolean
  error: string
  bootComplete: boolean
  setShowTokenHelp: (v: boolean) => void
  tokenInputRef: React.RefObject<HTMLInputElement | null>
  isLoading: (id: string) => boolean
  isLoaded: (id: string) => boolean
  currentLoadingText: string
}

export function AuthForm({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  token,
  setToken,
  handleLogin,
  handleBiometric,
  loading,
  error,
  bootComplete,
  setShowTokenHelp,
  tokenInputRef,
  isLoading,
  isLoaded,
  currentLoadingText,
}: AuthFormProps) {
  const emailId = useId()
  const passwordId = useId()
  const tokenId = useId()
  const errorId = useId()

  return (
    <div role="region" aria-label="Authentication Form">
      {/* Mode Toggle */}
      <div
        className={`transition-all duration-500 delay-100 ${isLoaded('inputs') ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          role="tablist"
          className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-8"
          aria-label="Login method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'token'}
            onClick={() => setMode('token')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              mode === 'token'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            Token
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'email'}
            onClick={() => setMode('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              mode === 'email'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Email
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Input Fields Loading */}
        {isLoading('inputs') && (
          <div className="py-8 flex items-center justify-center">
            <LoadingPlaceholder text={currentLoadingText} visible={true} />
          </div>
        )}

        {/* Input Fields Loaded */}
        <div
          className={`transition-all duration-500 ${isLoaded('inputs') ? 'opacity-100' : 'opacity-0'}`}
        >
          {mode === 'email' ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor={emailId}
                  className="text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Email Address
                </label>
                <Input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  placeholder="user@vector.mil"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={!!error && mode === 'email'}
                  aria-describedby={error ? errorId : undefined}
                  className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={passwordId}
                  className="text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Password
                </label>
                <Input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={!!error && mode === 'email'}
                  aria-describedby={error ? errorId : undefined}
                  className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor={tokenId}
                  className="text-sm font-medium text-center block text-slate-300"
                >
                  Appointment token
                </label>
                <div className="relative group">
                  <div
                    className="absolute -inset-1 vector-gradient rounded-xl blur opacity-25 group-focus-within:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <input
                      id={tokenId}
                      ref={tokenInputRef}
                      type="text"
                      placeholder="M-XXXX-XX"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      aria-invalid={!!error && mode === 'token'}
                      aria-describedby={error ? errorId : undefined}
                      className="flex w-full h-16 text-center text-2xl tracking-[0.2em] font-black uppercase bg-slate-950/80 border-2 border-slate-700 text-white placeholder:text-slate-700 focus:border-blue-500 font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <Key
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokenHelp(true)}
                  className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors mx-auto"
                  aria-label="Explain clinical identity tokens"
                >
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  <span>What's a Token? Where do I find it?</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="group p-5 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-slate-900/50 transition-all duration-300"
                  aria-label="Scan QR Code"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-3 group-hover:bg-blue-900/30 transition-colors">
                    <QrCode
                      className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                    Scan QR
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleBiometric}
                  className="group p-5 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col items-center justify-center hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all duration-300"
                  aria-label="Login with Biometrics"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-3 group-hover:bg-emerald-900/30 transition-colors">
                    <Fingerprint
                      className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                    Biometric
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div
            id={errorId}
            role="alert"
            className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 animate-scale-in"
          >
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Submit Button Loading */}
        {isLoading('button') && (
          <div className="py-4 flex items-center justify-center">
            <LoadingPlaceholder text={currentLoadingText} visible={true} />
          </div>
        )}

        {/* Submit Button Loaded */}
        <div
          className={`transition-all duration-500 ${isLoaded('button') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full h-14 text-sm"
            isLoading={loading}
            disabled={!bootComplete}
          >
            {mode === 'token' ? (
              <>
                <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                Sign in
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
                Sign in
              </>
            )}
          </Button>
        </div>

        {/* Footer Loading */}
        {isLoading('footer') && (
          <div className="py-4 flex items-center justify-center">
            <LoadingPlaceholder text={currentLoadingText} visible={true} />
          </div>
        )}

        {/* Footer Links */}
        <div
          className={`transition-all duration-500 ${isLoaded('footer') ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex flex-col items-center gap-4 pt-4">
            {mode === 'email' && (
              <Link
                to="/register"
                className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                Create an account
              </Link>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
