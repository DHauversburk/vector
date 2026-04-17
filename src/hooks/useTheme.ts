import { useContext } from 'react'
import { ThemeProviderContext } from '../contexts/ThemeContext'

/**
 * Hook to access the theme context
 * @returns {ThemeProviderState} The theme context value
 * @throws {Error} If used outside of a ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
