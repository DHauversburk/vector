import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

/**
 * Global Session Timeout hook
 * Automatically signs out a user after a period of inactivity.
 * Shows a warning toast 1 minute before logout.
 */
export function useSessionTimeout(
    warningTimeMs: number = 14 * 60 * 1000, // Default 14 mins
    logoutTimeMs: number = 15 * 60 * 1000   // Default 15 mins
) {
    const { session, signOut } = useAuth();

    useEffect(() => {
        // Only run if user is logged in
        if (!session) return;

        let warningTimeout: NodeJS.Timeout;
        let logoutTimeout: NodeJS.Timeout;

        const resetTimers = () => {
            clearTimeout(warningTimeout);
            clearTimeout(logoutTimeout);

            warningTimeout = setTimeout(() => {
                toast.warning('Session expires in 1 minute - interact to stay logged in.', {
                    duration: 10000,
                });
            }, warningTimeMs);

            logoutTimeout = setTimeout(() => {
                toast.error('Session expired due to inactivity.', { duration: 5000 });
                signOut();
            }, logoutTimeMs);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimers));
        resetTimers();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimers));
            clearTimeout(warningTimeout);
            clearTimeout(logoutTimeout);
        };
    }, [session, signOut, warningTimeMs, logoutTimeMs]);
}
