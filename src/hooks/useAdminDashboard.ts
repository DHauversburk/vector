import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuth } from './useAuth'
import { useTheme } from './useTheme'

export type ActionContext = 'view' | 'block' | 'unblock' | 'override'
export type DashboardView = 'schedule' | 'tokens' | 'logs' | 'maintenance' | 'feedback' | 'account'

export function useAdminDashboard() {
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [actionContext, setActionContext] = useState<ActionContext>('view')
  const [currentView, setCurrentView] = useState<DashboardView>('schedule')
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({ total_users: 0, active_appointments: 0 })

  const loadStats = useCallback(async () => {
    try {
      const s = await api.getSystemStats()
      setStats(s)
    } catch (error) {
      console.error('useAdminDashboard', error)
    }
  }, [])

  useEffect(() => {
    loadStats()

    const handleNav = (e: Event) => {
      const ce = e as CustomEvent
      if (['schedule', 'tokens', 'logs', 'maintenance', 'feedback'].includes(ce.detail)) {
        setCurrentView(ce.detail as DashboardView)
      }
    }
    window.addEventListener('vector-navigate', handleNav)
    return () => window.removeEventListener('vector-navigate', handleNav)
  }, [loadStats])

  const changeView = (view: DashboardView) => {
    setCurrentView(view)
    setMobileMenuOpen(false)
  }

  const toggleContext = () => setIsContextOpen(!isContextOpen)

  return {
    signOut,
    theme,
    setTheme,
    actionContext,
    setActionContext,
    currentView,
    setCurrentView: changeView,
    isContextOpen,
    setIsContextOpen,
    toggleContext,
    mobileMenuOpen,
    setMobileMenuOpen,
    stats,
  }
}
