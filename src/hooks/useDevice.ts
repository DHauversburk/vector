import { useContext } from 'react'
import { DeviceContext } from '../contexts/DeviceContext'

/**
 * Hook to access the device context
 * @returns {DeviceContextValue} The device context value
 * @throws {Error} If used outside of a DeviceProvider
 */
export function useDevice() {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider')
  }
  return context
}
