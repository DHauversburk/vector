/**
 * PatientEditModal — inline editor for a patient's token alias and account status.
 *
 * Providers can update the display alias and enable/disable a patient account
 * without leaving the patient directory. Changes are persisted via api.updateUser().
 */

import { useState, useEffect, useId } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useAnnouncer } from '../ui/ScreenReaderAnnouncer'
import { api } from '../../lib/api'
import { type PublicUser } from '../../lib/api'

interface PatientEditModalProps {
  member: {
    id: string
    token_alias: string
    status: 'active' | 'disabled'
    created_at: string
  } | null
  onClose: () => void
  onSave: (updated: {
    id: string
    token_alias: string
    status: 'active' | 'disabled'
    created_at: string
  }) => void
}

export function PatientEditModal({ member, onClose, onSave }: PatientEditModalProps) {
  const isOpen = member !== null
  const containerRef = useFocusTrap(isOpen, { onEscape: onClose })
  const { announce } = useAnnouncer()

  const [alias, setAlias] = useState('')
  const [status, setStatus] = useState<'active' | 'disabled'>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const aliasId = useId()
  const statusId = useId()

  useEffect(() => {
    if (member) {
      setAlias(member.token_alias)
      setStatus(member.status)
      setError('')
      announce(`Edit patient dialog opened for ${member.token_alias}`, 'polite')
    }
  }, [member, announce])

  if (!isOpen || !member) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = alias.trim()
    if (!trimmed) {
      setError('Alias cannot be empty.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const updated = await api.updateUser(member.id, {
        token_alias: trimmed,
        status,
      } as Partial<PublicUser>)

      onSave({
        id: updated.id,
        token_alias: updated.token_alias,
        status: (updated.status ?? 'active') as 'active' | 'disabled',
        created_at: member.created_at,
      })
      announce('Patient record updated.', 'polite')
      onClose()
    } catch {
      setError('Could not save changes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-edit-title"
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
      >
        {/* Indigo accent bar */}
        <div className="h-1.5 w-full bg-indigo-500" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3
              id="patient-edit-title"
              className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              Edit Patient Record
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor={aliasId}
                className="text-xs font-black text-slate-500 uppercase tracking-widest"
              >
                Token Alias
              </label>
              <Input
                id={aliasId}
                type="text"
                autoComplete="off"
                autoFocus
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. BRAVO-7"
                className="h-10 text-sm font-mono bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={statusId}
                className="text-xs font-black text-slate-500 uppercase tracking-widest"
              >
                Account Status
              </label>
              <select
                id={statusId}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}
                className="w-full h-10 px-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-10 text-xs font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              >
                {!loading && <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
