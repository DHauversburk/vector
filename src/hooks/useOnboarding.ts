import { useContext } from 'react';
import { OnboardingContext } from '../contexts/OnboardingContext';

/**
 * Hook to access the onboarding context
 * @returns {OnboardingContextType} The onboarding context value
 * @throws {Error} If used outside of an OnboardingProvider
 */
export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
}
