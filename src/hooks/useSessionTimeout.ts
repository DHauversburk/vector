import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

/**
 * Global Session Timeout hook
 * Automatically locks or signs out a user after a period of inactivity.
 * Features:
 * 1. Warning toast (1 minute before)
 * 2. Lock screen (after inactivity)
 * 3. Final Sign-out (after extended inactivity)
 */
export function useSessionTimeout(
    warningTimeMs: number = 29 * 60 * 1000, // Def 29 mins (Warning)
    lockTimeMs: number = 30 * 60 * 1000,    // Def 30 mins (Lock)
    logoutTimeMs: number = 60 * 60 * 1000   // Def 1 hour (Sign Out)
) {
    const { session, signOut } = useAuth();
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        // Only run if user is logged in
        if (!session) return;

        let warningTimeout: NodeJS.Timeout;
        let lockTimeout: NodeJS.Timeout;
        let logoutTimeout: NodeJS.Timeout;

        const resetTimers = () => {
            // Don't reset if already locked!
            if (isLocked) return;

            clearTimeout(warningTimeout);
            clearTimeout(lockTimeout);
            clearTimeout(logoutTimeout);

            warningTimeout = setTimeout(() => {
                toast.warning('Security: Session will lock in 1 minute due to inactivity.');
            }, warningTimeMs);

            lockTimeout = setTimeout(() => {
                setIsLocked(true);
            }, lockTimeMs);

            logoutTimeout = setTimeout(() => {
                toast.error('Session expired. Safety sign-out performed.');
                signOut();
            }, logoutTimeMs);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => window.addEventListener(event, resetTimers));
        resetTimers();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimers));
            clearTimeout(warningTimeout);
            clearTimeout(lockTimeout);
            clearTimeout(logoutTimeout);
        };
    }, [session, isLocked, signOut, warningTimeMs, lockTimeMs, logoutTimeMs]);

    return {
        isLocked,
        unlock: () => setIsLocked(false)
    };
}
