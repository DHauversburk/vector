import { useContext } from 'react';
import { OfflineContext } from '../contexts/OfflineContext';

/**
 * Hook to access the offline sync context
 * @returns {OfflineContextType} The offline context value
 * @throws {Error} If used outside of an OfflineProvider
 */
export function useOffline() {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
