import type { IAuthActions } from '../interfaces';

/**
 * Hashes a PIN string using SHA-256 via the Web Crypto API.
 */
async function hashPin(pin: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        let hash = 0;
        const combined = `VECTOR_SALT_${pin}`;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `fallback_${Math.abs(hash).toString(16)}`;
    }
}

export const supabaseAuth: IAuthActions = {
    setTacticalPin: async (userId: string, pin: string): Promise<void> => {
        const hashed = await hashPin(pin);
        localStorage.setItem(`TACTICAL_PIN_${userId}`, hashed);
    },

    getTacticalPin: async (userId: string): Promise<string | null> => {
        return localStorage.getItem(`TACTICAL_PIN_${userId}`);
    },

    verifyTacticalPin: async (userId: string, pin: string): Promise<boolean> => {
        const storedHash = localStorage.getItem(`TACTICAL_PIN_${userId}`);
        if (!storedHash) return false;
        const inputHash = await hashPin(pin);
        return inputHash === storedHash;
    }
};
