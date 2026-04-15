/**
 * SyncManager - Utility component to monitor and manage offline mutation queue
 *
 * Provides visibility into pending, syncing, and failed mutations with manual
 * retry and clear actions. Essential for "Battle-Ready" resilience.
 */

import React, { useState, useEffect } from 'react'
import { RefreshCcw, AlertCircle, Trash2, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import { OfflineQueue, type OfflineRequest } from '../../lib/offline/queue'
import { useOffline } from '../../hooks/useOffline'
import { Button } from '../ui/Button'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

interface SyncManagerProps {
  isOpen: boolean
  onClose: () => void
}

export const SyncManager: React.FC<SyncManagerProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<OfflineRequest[]>([])
  const [loading, setLoading] = useState(false)
  const { syncNow, isOnline } = useOffline()

  const loadQueue = async () => {
    setLoading(true)
    try {
      const queue = await OfflineQueue.getAll()
      setItems(queue.sort((a, b) => b.timestamp - a.timestamp))
    } catch (e) {
      console.error('Failed to load queue', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadQueue()
    }
  }, [isOpen])

  const handleRetry = async () => {
    toast.promise(syncNow(), {
      loading: 'Attempting manual sync...',
      success: 'Sync complete',
      error: 'Sync engine error',
    })
    // Reload after a delay to show updates
    setTimeout(loadQueue, 1000)
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    await OfflineQueue.remove(id)
    toast.success('Mutation removed from queue')
    loadQueue()
  }

  const handleClear = async () => {
    if (confirm('Permanently clear all pending changes? This cannot be undone.')) {
      await OfflineQueue.clear()
      toast.success('Sync queue cleared')
      loadQueue()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <RefreshCcw className={cn('w-5 h-5 text-indigo-500', loading && 'animate-spin')} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Sync queue
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Network Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-500">
                    <div className="w-1 h-1 rounded-full bg-rose-500" />
                    Disconnected Mode
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-slate-400 rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Local Outbox Empty
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                All changes are synchronized with central command.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all flex items-center justify-between gap-4',
                  item.status === 'failed'
                    ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'
                    : item.status === 'syncing'
                      ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20 animate-pulse'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={cn(
                        'text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest',
                        item.status === 'failed'
                          ? 'bg-rose-500 text-white'
                          : item.status === 'syncing'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
                      )}
                    >
                      {item.status}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">
                      {item.operationName.replace(/_/g, ' ')}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(item.timestamp, 'HH:mm:ss')}
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3" />
                      {item.retryCount} Retries
                    </span>
                    {item.id && <span className="text-[8px] opacity-40">#{item.id}</span>}
                  </div>
                  {item.error && (
                    <p className="mt-2 text-[10px] font-bold text-rose-500 lowercase bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                      {item.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                  title="Discard Mutation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={items.length === 0}
            className="flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear queue
          </Button>
          <Button
            onClick={handleRetry}
            disabled={!isOnline || items.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <RefreshCcw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Retry All
          </Button>
        </div>

        <div className="px-6 py-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Encrypted local queue</span>
          </div>
        </div>
      </div>
    </div>
  )
}
