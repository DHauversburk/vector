import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import {
  Lock,
  Mail,
  Shield,
  Monitor,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  QrCode,
  Smartphone,
  LogOut,
} from 'lucide-react'
import { api } from '../../lib/api'
import type { MFAFactor } from '../../lib/api'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ConfirmModal } from '../ui/ConfirmModal'
import { useAuth } from '../../hooks/useAuth'
import { logger } from '../../lib/logger'

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            {title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

// ─── Password Section ────────────────────────────────────────────────────────
function PasswordSection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.updatePassword(newPassword)
      toast.success('Password updated. Use your new password on next login.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      logger.error('AccountSettings.password', err)
      toast.error('Password update failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section icon={Lock} title="Password" subtitle="Change your login password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full pr-10 pl-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full pr-10 pl-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[10px] font-bold text-red-500" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          isLoading={loading}
          disabled={!newPassword || !confirmPassword}
          className="h-10 text-[10px] font-black uppercase tracking-widest"
        >
          Update Password
        </Button>
      </form>
    </Section>
  )
}

// ─── Email Section ────────────────────────────────────────────────────────
function EmailSection() {
  const { user } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setLoading(true)
    try {
      await api.updateEmail(newEmail.trim())
      toast.success('Confirmation links sent to both addresses. Check your inbox.')
      setNewEmail('')
    } catch (err) {
      logger.error('AccountSettings.email', err)
      toast.error('Email update failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section icon={Mail} title="Email Address" subtitle="Update your login email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            Current Email
          </label>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">
            {user?.email ?? '—'}
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            New Email Address
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="new@example.com"
          />
          <p className="text-[10px] font-bold text-slate-400 mt-1.5">
            We'll send a confirmation link to both addresses.
          </p>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          disabled={!newEmail.trim()}
          className="h-10 text-[10px] font-black uppercase tracking-widest"
        >
          Update Email
        </Button>
      </form>
    </Section>
  )
}

// ─── MFA Section ─────────────────────────────────────────────────────────────
function MFASection() {
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loadingFactors, setLoadingFactors] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollData, setEnrollData] = useState<{
    qrCode: string
    secret: string
    factorId: string
  } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [disablingId, setDisablingId] = useState<string | null>(null)
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null)

  const loadFactors = async () => {
    try {
      const data = await api.listMFAFactors()
      setFactors(data)
    } catch (err) {
      logger.error('AccountSettings.mfa', err)
    } finally {
      setLoadingFactors(false)
    }
  }

  useEffect(() => {
    loadFactors()
  }, [])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const data = await api.enrollMFA()
      setEnrollData(data)
    } catch (err) {
      logger.error('AccountSettings.mfa.enroll', err)
      toast.error('Could not start 2FA setup. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleVerify = async () => {
    if (!enrollData || !verifyCode.trim()) return
    setVerifying(true)
    try {
      await api.verifyMFA(enrollData.factorId, verifyCode.trim())
      toast.success('Two-factor authentication enabled.')
      setEnrollData(null)
      setVerifyCode('')
      await loadFactors()
    } catch (err) {
      logger.error('AccountSettings.mfa.verify', err)
      toast.error('Invalid code. Check your authenticator app and try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisable = async () => {
    if (!confirmDisable) return
    setDisablingId(confirmDisable)
    try {
      await api.unenrollMFA(confirmDisable)
      toast.success('Two-factor authentication disabled.')
      await loadFactors()
    } catch (err) {
      logger.error('AccountSettings.mfa.unenroll', err)
      toast.error('Could not disable 2FA. Please try again.')
    } finally {
      setDisablingId(null)
      setConfirmDisable(null)
    }
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified')
  const hasVerifiedFactor = verifiedFactors.length > 0

  return (
    <Section icon={Shield} title="Two-Factor Authentication" subtitle="TOTP authenticator app">
      {loadingFactors ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      ) : hasVerifiedFactor ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">2FA Active</span>
          </div>
          {verifiedFactors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {f.friendly_name ?? 'Authenticator App'}
                </span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDisable(f.id)}
                isLoading={disablingId === f.id}
                className="h-7 text-[9px] font-black uppercase tracking-widest"
              >
                Disable
              </Button>
            </div>
          ))}
        </div>
      ) : enrollData ? (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then
            enter the 6-digit code below to confirm.
          </p>
          <div className="flex justify-center p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <img
              src={enrollData.qrCode}
              alt="QR code for authenticator app"
              className="w-40 h-40"
            />
          </div>
          <details className="text-[10px] text-slate-400">
            <summary className="cursor-pointer font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300">
              Can't scan? Enter key manually
            </summary>
            <p className="mt-2 font-mono break-all bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {enrollData.secret}
            </p>
          </details>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              className="w-36 px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-lg font-black font-mono tracking-[0.3em] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="000000"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              isLoading={verifying}
              disabled={verifyCode.length !== 6}
              className="h-10 text-[10px] font-black uppercase tracking-widest"
            >
              Verify &amp; Enable
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEnrollData(null)
                setVerifyCode('')
              }}
              className="h-10 text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500">
            Add a second layer of security to your account. You'll need an authenticator app on your
            phone.
          </p>
          <Button
            onClick={handleEnroll}
            isLoading={enrolling}
            variant="outline"
            className="h-10 text-[10px] font-black uppercase tracking-widest"
          >
            <QrCode className="w-3.5 h-3.5 mr-2" />
            Enable 2FA
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDisable !== null}
        onClose={() => setConfirmDisable(null)}
        onConfirm={handleDisable}
        title="Disable Two-Factor Auth"
        description="This will remove 2FA from your account. You will only need your password to log in. You can re-enable it at any time."
        confirmLabel="Disable 2FA"
        cancelLabel="Keep 2FA"
        variant="destructive"
        loading={disablingId !== null}
      />
    </Section>
  )
}

// ─── Sessions Section ─────────────────────────────────────────────────────────
function SessionsSection() {
  const { session } = useAuth()
  const [signing, setSigning] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const handleSignOutOthers = async () => {
    setSigning(true)
    try {
      await api.signOutOtherSessions()
      toast.success('All other sessions signed out.')
    } catch (err) {
      logger.error('AccountSettings.sessions', err)
      toast.error('Could not sign out other sessions.')
    } finally {
      setSigning(false)
      setConfirmSignOut(false)
    }
  }

  return (
    <Section icon={Monitor} title="Sessions" subtitle="Active login sessions">
      <div className="space-y-4">
        {session && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Current Session
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <dt className="font-black text-slate-400 uppercase tracking-widest">Signed in</dt>
                <dd className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {session.user.last_sign_in_at
                    ? format(parseISO(session.user.last_sign_in_at), 'MMM d, yyyy HH:mm')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-black text-slate-400 uppercase tracking-widest">Expires</dt>
                <dd className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {session.expires_at
                    ? format(new Date(session.expires_at * 1000), 'MMM d, yyyy HH:mm')
                    : '—'}
                </dd>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-slate-500 mb-3">
            Sign out all other browsers and devices where you're currently logged in.
          </p>
          <Button
            variant="outline"
            onClick={() => setConfirmSignOut(true)}
            isLoading={signing}
            className="h-10 text-[10px] font-black uppercase tracking-widest border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out Other Sessions
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={handleSignOutOthers}
        title="Sign Out Other Sessions"
        description="All other browsers and devices where you're logged in will be signed out immediately. Your current session is not affected."
        confirmLabel="Sign Out Others"
        cancelLabel="Cancel"
        variant="warning"
        loading={signing}
      />
    </Section>
  )
}

// ─── Root export ─────────────────────────────────────────────────────────────
export function AccountSettings() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          {user?.user_metadata?.token_alias ?? user?.email ?? 'Your account'}
        </p>
      </div>

      <PasswordSection />
      <EmailSection />
      <MFASection />
      <SessionsSection />
    </div>
  )
}
