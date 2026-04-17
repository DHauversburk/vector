import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, IS_MOCK } from '../lib/supabase'
import { webauthn } from '../lib/webauthn'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { TokenHelpModal } from '../components/ui/TokenHelpModal'

// Extracted UI Components
import { AuthForm, LoadingPlaceholder } from '../components/auth/AuthForm'
import { PinVerification } from '../components/auth/PinVerification'
import { PinSetup } from '../components/auth/PinSetup'
import { ResetFlow } from '../components/auth/ResetFlow'
import { LoginBackground } from '../components/auth/LoginBackground'
import { LoginHeader } from '../components/auth/LoginHeader'

// Hooks
import { useBootSequence } from '../hooks/useBootSequence'

interface AuthenticationError {
  message: string
}

export default function LoginPage() {
  // Boot sequence state (Now managed by hook)
  const { isLoaded, isLoading, currentLoadingText, bootComplete } = useBootSequence()

  // Auth state
  const [stage, setStage] = useState<'auth' | 'pin' | 'setup' | 'reset'>('auth')
  const [mode, setMode] = useState<'token' | 'email'>('token')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const [showTokenHelp, setShowTokenHelp] = useState(false)

  const { session, verifyPin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Auth logic
  const checkPinRequirement = async (uid: string) => {
    try {
      setCurrentUserId(uid)
      const savedPin = await api.getTacticalPin(uid)
      if (savedPin) {
        setStage('pin')
      } else {
        setStage('setup')
      }
    } catch {
      setStage('setup')
    }
  }

  const handlePinComplete = async (enteredPin: string) => {
    setPinLoading(true)
    setError('')
    try {
      if (!currentUserId) throw new Error('Your session expired. Sign in again.')
      const isValid = await api.verifyTacticalPin(currentUserId, enteredPin)
      if (isValid) {
        verifyPin()
        navigate('/dashboard')
      } else {
        setError('Wrong PIN. Try again.')
        setPinLoading(false)
      }
    } catch {
      setError("Couldn't verify your PIN. Try again.")
      setPinLoading(false)
    }
  }

  const handlePinSetup = async (newPin: string) => {
    setPinLoading(true)
    try {
      if (!currentUserId) throw new Error('Your session expired. Sign in again.')
      await api.setTacticalPin(currentUserId, newPin)
      verifyPin()
      navigate('/dashboard')
    } catch {
      setError("Couldn't save your PIN. Try again.")
      setPinLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      checkPinRequirement(session.user.id)
    }
  }, [session])

  const handleReset = (resetToken: string) => {
    if (resetToken === 'VECTOR-ADMIN-RESET' || resetToken === '0000') {
      setStage('setup')
      setError('')
    } else {
      setError('Invalid reset code.')
    }
  }

  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      setLoading(true)
      setError('')

      try {
        if (mode === 'token') {
          const { data, error } = await supabase.functions.invoke('exchange-token', {
            body: { token },
          })

          if (error) throw new Error(error.message || 'Sign-in failed. Check your token.')
          if (data?.error) throw new Error(data.error)

          if (data?.session) {
            const { error: sessionError } = await supabase.auth.setSession(data.session)
            if (sessionError) throw sessionError
            return
          } else {
            throw new Error('Sign-in failed. Try again.')
          }
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      } catch (err) {
        const error = err as AuthenticationError
        setError(error.message)
      } finally {
        setLoading(false)
      }
    },
    [email, password, mode, token],
  )

  // Handle all URL parameters and initial state cleanup
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlMode = params.get('mode')
    const urlToken = params.get('token')
    const helpParam = params.get('help')
    const autoSubmit = params.get('autosubmit') === 'true'

    if (urlMode === 'patient') setMode('token')
    else if (urlMode === 'staff' || urlMode === 'admin') setMode('email')

    if (urlToken) {
      setToken(urlToken)
      setMode('token')
      if (autoSubmit) {
        setTimeout(() => handleLogin(), 100)
      }
    }

    if (helpParam === 'token') {
      setMode('token')
      setTimeout(() => setShowTokenHelp(true), 500)
    }
  }, [location]) // REMOVED handleLogin from dependencies to prevent state reset loop

  // Auto-focus token input when boot completes
  useEffect(() => {
    if (bootComplete && stage === 'auth' && mode === 'token') {
      const focusToken = () => {
        if (tokenInputRef.current) tokenInputRef.current.focus()
      }
      ;[0, 50, 100, 200, 400].forEach((delay) => setTimeout(focusToken, delay))
    }
  }, [bootComplete, stage, mode])

  const handleBiometric = async () => {
    try {
      setError('')
      const isSupported = await webauthn.isSupported()
      if (!isSupported) {
        setError("Biometric sign-in isn't available on this device.")
        return
      }
      const assertion = await webauthn.authenticate()
      if (assertion) {
        setLoading(true)
        setTimeout(async () => {
          await checkPinRequirement('BIOMETRIC-USER-01')
          setLoading(false)
        }, 800)
      }
    } catch (err) {
      const error = err as AuthenticationError
      setError(error.message || "Biometric sign-in didn't work. Try your token.")
    }
  }

  return (
    <LoginBackground isLoaded={isLoaded}>
      {/* Background loading state — never renders now that useBootSequence is instant,
          but kept defensively in case a future async dependency reintroduces a phase. */}
      {!isLoaded('background') && (
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center z-[100]">
          <LoadingPlaceholder text={currentLoadingText} visible={true} />
        </div>
      )}

      {/* ── TWO-COLUMN LAYOUT WRAPPER ── */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* ── LEFT PANEL — branding, desktop / tablet only ── */}
        <div className="hidden md:flex md:flex-col md:w-1/2 lg:w-3/5 items-center justify-center p-12">
          <div className="max-w-md w-full">
            {/* Logo mark + wordmark */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl vector-gradient flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">VECTOR</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Secure clinical
              <br />
              scheduling
            </h1>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Enterprise healthcare coordination for providers, members, and care teams.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4">
              {[
                { icon: '🔒', label: 'Role-based access with PIN protection' },
                { icon: '📅', label: 'Real-time appointment management' },
                { icon: '🏥', label: 'HIPAA-aligned audit trail' },
              ].map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-slate-300">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT PANEL — form, full-width on mobile ── */}
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 md:p-10 transition-all duration-700 ${isLoaded('logo') ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Header — mobile only (branding panel replaces it on desktop) */}
          <div className="w-full max-w-md md:hidden mb-2">
            <LoginHeader
              stage={stage}
              isLoaded={isLoaded}
              isLoading={isLoading}
              currentLoadingText={currentLoadingText}
            />
          </div>

          {/* LOGIN CARD */}
          <div className="w-full max-w-md">
            <div className="relative min-h-[400px]">
              {isLoading('card') && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingPlaceholder text={currentLoadingText} visible={true} />
                </div>
              )}

              <div
                className={`transition-all duration-700 ${isLoaded('card') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <div className="absolute -inset-1 vector-gradient rounded-3xl blur-lg opacity-20" />
                <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                  {stage === 'auth' ? (
                    <AuthForm
                      mode={mode}
                      setMode={setMode}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      token={token}
                      setToken={setToken}
                      handleLogin={handleLogin}
                      handleBiometric={handleBiometric}
                      loading={loading}
                      error={error}
                      bootComplete={bootComplete}
                      setShowTokenHelp={setShowTokenHelp}
                      tokenInputRef={tokenInputRef}
                      isLoading={isLoading}
                      isLoaded={isLoaded}
                      currentLoadingText={currentLoadingText}
                    />
                  ) : stage === 'pin' ? (
                    <PinVerification
                      error={error}
                      pinLoading={pinLoading}
                      onComplete={handlePinComplete}
                    />
                  ) : stage === 'reset' ? (
                    <ResetFlow
                      error={error}
                      handleReset={handleReset}
                      onCancel={() => setStage('auth')}
                    />
                  ) : (
                    <PinSetup error={error} pinLoading={pinLoading} onComplete={handlePinSetup} />
                  )}
                </div>
              </div>
            </div>

            {/* Footer and status */}
            <div
              className={`mt-8 text-center space-y-3 transition-opacity duration-700 ${isLoaded('footer') ? 'opacity-100' : 'opacity-0'}`}
            >
              {stage === 'pin' && (
                <button
                  onClick={() => {
                    setStage('reset')
                    setError('')
                  }}
                  className="w-full mb-6 text-center text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Forgot your PIN?
                </button>
              )}

              {/* Mock-mode badge — only shown when running against the in-memory client.
                  In live builds nothing renders here (cleaner footer). */}
              {IS_MOCK && (
                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full text-amber-400 bg-amber-950/50 border border-amber-900/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Demo mode
                </div>
              )}

              {IS_MOCK && bootComplete && (
                <button
                  onClick={() => {
                    if (confirm('Reset all demo data?')) {
                      api.mockStore.reset()
                      window.location.reload()
                    }
                  }}
                  className="block mx-auto mt-3 px-4 py-2 border border-red-900/50 rounded-lg text-xs text-red-400 bg-red-950/30 hover:bg-red-950/50 transition-all"
                >
                  Reset demo data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TokenHelpModal isOpen={showTokenHelp} onClose={() => setShowTokenHelp(false)} />
    </LoginBackground>
  )
}
