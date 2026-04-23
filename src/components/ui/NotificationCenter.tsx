import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Calendar, X, HelpCircle, Info, CheckCheck } from 'lucide-react'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import type { Notification, NotificationType } from '../../lib/api/types'

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  appointment_booked: Calendar,
  appointment_cancelled: X,
  help_request: HelpCircle,
  system: Info,
}

const TYPE_COLOR: Record<NotificationType, string> = {
  appointment_booked: 'text-emerald-500',
  appointment_cancelled: 'text-rose-500',
  help_request: 'text-amber-500',
  system: 'text-indigo-500',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.getNotifications(user.id)
      setNotifications(data)
      setUnread(data.filter((n) => !n.read).length)
    } catch {
      // silently fail — notifications are non-critical
    }
  }, [user])

  // Load on mount and every 30 s
  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 30_000)
    return () => clearInterval(id)
  }, [load])

  // Load fresh data when panel opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [open, load])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    await api.markAllNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
          open
            ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
            : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800',
        )}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          aria-modal="false"
          className={cn(
            'absolute right-0 mt-2 w-80 z-50',
            'bg-white dark:bg-slate-900',
            'border border-slate-200 dark:border-slate-700',
            'rounded-xl shadow-xl overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-150',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <ul
            className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
            aria-live="polite"
            aria-label="Notification list"
          >
            {loading && notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-400">Loading…</li>
            )}
            {!loading && notifications.length === 0 && (
              <li className="px-4 py-8 text-center">
                <Bell
                  className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
              </li>
            )}
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Info
              const color = TYPE_COLOR[n.type] ?? 'text-slate-500'
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    n.read ? 'bg-white dark:bg-slate-900' : 'bg-indigo-50/60 dark:bg-indigo-900/10',
                  )}
                >
                  <span className={cn('mt-0.5 shrink-0', color)} aria-hidden="true">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        n.read
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-900 dark:text-white font-medium',
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Mark as read"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500" aria-hidden="true" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
