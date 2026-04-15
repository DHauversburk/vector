/**
 * Dashboard router — picks the dashboard for the authenticated user's role.
 *
 * - admin    → AdminDashboard
 * - provider → ProviderDashboard
 * - member   → MemberDashboard (default)
 */
import { useAuth } from '../hooks/useAuth'
import MemberDashboard from './MemberDashboard'
import ProviderDashboard from './ProviderDashboard'
import AdminDashboard from './AdminDashboard'

export default function Dashboard() {
  const { role } = useAuth()

  if (role === 'admin') {
    return <AdminDashboard />
  }

  return role === 'provider' ? <ProviderDashboard /> : <MemberDashboard />
}
