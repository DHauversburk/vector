import { api } from '../api'

/**
 * Standard fetcher for SWR
 * Maps string keys to API function calls
 */
export const swrFetcher = async (key: string | any[]) => {
  if (typeof key === 'string') {
    const [resource, ...args] = key.split(':')

    switch (resource) {
      case 'appointments':
        return await api.getMyAppointments()
      case 'providers':
        return await api.getProviders()
      case 'waitlist':
        return await api.getMyWaitlist()
      case 'note-stats':
        return await api.getNoteStatistics(args[0] ? parseInt(args[0]) : 6)
      default:
        throw new Error(`SWR Fetcher: Unknown resource ${resource}`)
    }
  }

  // Handle array keys if needed
  if (Array.isArray(key)) {
    const [resource, ...args] = key
    switch (resource) {
      case 'provider-schedule':
        return await api.getProviderSchedule(args[0], args[1], args[2])
      case 'provider-slots':
        return await api.getProviderOpenSlots(args[0], args[1])
      default:
        throw new Error(`SWR Fetcher: Unknown array resource ${resource}`)
    }
  }
}
