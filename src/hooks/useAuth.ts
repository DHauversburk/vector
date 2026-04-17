import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * Hook to access the authentication context
 * @returns {AuthContextType} The authentication context value
 * @throws {Error} If used outside of an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
