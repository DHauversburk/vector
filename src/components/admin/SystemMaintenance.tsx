import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react'
import { logger } from '../../lib/logger'

type ConfirmAction = 'dedup' | 'prune' | 'reset' | null

const CONFIRM_CONFIG: Record<
  NonNullable<ConfirmAction>,
  {
    title: string
    description: (ctx: { duplicates?: number; days?: number }) => string
    label: string
  }
> = {
  dedup: {
    title: 'Remove Duplicate Records',
    description: ({ duplicates }) =>
      `This will permanently delete ${duplicates ?? 'duplicate'} duplicate user record${duplicates !== 1 ? 's' : ''}, keeping the oldest entry for each token alias. Appointments linked to removed records may be affected. This cannot be undone.`,
    label: 'Remove Duplicates',
  },
  prune: {
    title: 'Prune Inactive Accounts',
    description: ({ days }) =>
      `This will permanently remove member accounts that have not logged in within the last ${days ?? 60} days. All associated data will be deleted. This cannot be undone.`,
    label: 'Prune Accounts',
  },
  reset: {
    title: 'Reset Environment Data',
    description: () =>
      'This will reset all appointment and audit data on this environment. This cannot be undone.',
    label: 'Reset Data',
  },
}

export const SystemMaintenance = () => {
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [scanResults, setScanResults] = useState<{
    total_users: number
    active_appointments: number
    available_slots: number
    errors_today: number
    duplicates: number
  } | null>(null)
  const [pruneDays, setPruneDays] = useState(60)

  const scanDatabase = async () => {
    setLoading(true)
    try {
      const stats = await api.getSystemStats()
      setScanResults(stats)
    } catch (error) {
      logger.error('SystemMaintenance', error)
      toast.error('Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    setConfirmLoading(true)
    try {
      if (confirmAction === 'dedup') {
        await api.fixDuplicateUsers()
        toast.success('Duplicates removed successfully.')
        await scanDatabase()
      } else if (confirmAction === 'prune') {
        const count = await api.pruneInactiveUsers(pruneDays)
        toast.success(`Removed ${count} inactive account${count !== 1 ? 's' : ''}.`)
        await scanDatabase()
      } else if (confirmAction === 'reset') {
        await api.resetMockData()
        toast.success('Environment data reset.')
        await scanDatabase()
      }
    } catch (error) {
      logger.error('SystemMaintenance', error)
      toast.error('Operation failed. Check logs.')
    } finally {
      setConfirmLoading(false)
      setConfirmAction(null)
    }
  }

  const activeConfig = confirmAction ? CONFIRM_CONFIG[confirmAction] : null

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <Database className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Database Hygiene
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            System Maintenance &amp; Cleanup
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Deduplication */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                User Deduplication
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Scan for users with identical Token Aliases.
              </p>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>

          {scanResults && scanResults.duplicates !== undefined ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 space-y-3">
              {scanResults.duplicates > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>
                      {scanResults.duplicates} duplicate record
                      {scanResults.duplicates !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <Button
                    onClick={() => setConfirmAction('dedup')}
                    isLoading={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-none text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Remove Duplicates
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Database Clean
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                    No duplicates found.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Run a scan to check for issues
              </p>
            </div>
          )}

          <Button
            onClick={scanDatabase}
            isLoading={loading}
            variant="outline"
            className="w-full text-[10px] font-black uppercase tracking-widest"
          >
            Start Integrity Scan
          </Button>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={() => setConfirmAction('reset')}
              className="w-full bg-slate-900 dark:bg-slate-950 text-white hover:bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest"
            >
              <Trash2 className="w-3 h-3 mr-2 text-red-500" />
              Reset Environment Data
            </Button>
          </div>
        </div>

        {/* Data Lifecycle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Data Lifecycle
              </h3>
              <p className="text-xs text-slate-500 mt-1">Remove inactive accounts and tokens.</p>
            </div>
            <Database className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Inactive Threshold</span>
              <select
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                value={pruneDays}
                onChange={(e) => setPruneDays(parseInt(e.target.value))}
              >
                <option value="30">30 Days</option>
                <option value="60">60 Days (Standard)</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Removes members who haven't logged in within the selected timeframe. Associated
              appointment data is preserved.
            </p>
            <Button
              onClick={() => setConfirmAction('prune')}
              isLoading={loading}
              variant="outline"
              className="w-full text-[10px] font-black uppercase tracking-widest border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Prune Inactive Accounts
            </Button>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                System Health
              </h3>
              <p className="text-xs text-slate-500 mt-1">Live metrics from the database.</p>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>

          {scanResults ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] uppercase text-slate-500 font-black">Users</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {scanResults.total_users}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] uppercase text-slate-500 font-black">Active Appts</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {scanResults.active_appointments}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] uppercase text-slate-500 font-black">Open Slots</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {scanResults.available_slots}
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/50">
                <div className="text-[10px] uppercase text-red-500 font-black">Errors Today</div>
                <div className="text-xl font-black text-red-700 dark:text-red-400">
                  {scanResults.errors_today}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded border border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                Run a scan to see metrics
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Single shared ConfirmModal */}
      {activeConfig && (
        <ConfirmModal
          isOpen={confirmAction !== null}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={activeConfig.title}
          description={activeConfig.description({
            duplicates: scanResults?.duplicates,
            days: pruneDays,
          })}
          confirmLabel={activeConfig.label}
          cancelLabel="Cancel"
          variant="destructive"
          loading={confirmLoading}
        />
      )}
    </div>
  )
}
