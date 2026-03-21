import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// MOCK MODE FLAG - Auto-detect based on environment variables OR manual override
// When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, uses real Supabase
// Otherwise, falls back to Mock Mode for offline development/demo

// SAFETY: For Beta, Force Mock Mode unless explicit Live Access is granted via LocalStorage
const liveAccess = typeof window !== 'undefined' && window.localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true';

let client: SupabaseClient<Database> | undefined;
let isMock = !liveAccess || !supabaseUrl || !supabaseAnonKey;

try {
    if (!isMock) {
        client = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
} catch (e) {
    logger.error('supabase', "Supabase Client Init Failed - Falling back to mock", e);
    isMock = true;
}

export const IS_MOCK = isMock;

// --- MOCK CLIENT IMPLEMENTATION ---

// Mock Event Emitter
const mockAuthListeners: Array<(event: string, session: any) => void> = [];

const notifyListeners = (event: string, session: any) => {
    mockAuthListeners.forEach(cb => cb(event, session));
};

// State for Mock Session
let mockSession: any = null;

// Initialize from LocalStorage if available
if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('PROJECT_VECTOR_MOCK_SESSION');
    if (stored) {
        try {
            mockSession = JSON.parse(stored);
        } catch (e) {
            logger.error('supabase', 'Failed to restore mock session', e);
        }
    }
}

const mockSupabase = {
    auth: {
        getSession: async () => ({
            data: { session: mockSession },
            error: null
        }),
        getUser: async () => ({
            data: { user: mockSession?.user ?? null },
            error: null
        }),
        signInWithPassword: async ({ email, password }: { email: string, password?: string }) => {
            logger.debug('MOCK', 'Auth Attempt:', email);
            
            const BETA_PASSWORD = 'VectorBeta2026!';
            if (password !== BETA_PASSWORD) {
                return {
                    data: { user: null, session: null },
                    error: { message: 'Invalid login credentials' }
                };
            }

            // Expanded Beta Login Logic
            const isProvider = email.includes('provider') || email.includes('medtech') || email.includes('doc') || email.includes('pt') || email.includes('mh');
            const isAdmin = email.includes('admin');
            const isPatient = email.includes('patient');

            if (!isAdmin && !isProvider && !isPatient) {
                return {
                    data: { user: null, session: null },
                    error: { message: 'Authentication restricted to authorized beta paths' }
                };
            }

            let userId = 'mock-user-123';
            let tokenAlias = 'BETA_TESTER';

            if (isAdmin) {
                userId = 'mock-admin-alex';
                tokenAlias = 'CMD. ALEX';
            } else if (isProvider) {
                if (email.includes('doc')) {
                    const num = email.match(/doc(\d+)/)?.[1] || '1';
                    userId = `mock-provider-doc-${num}`;
                    tokenAlias = `DR. DOCTOR ${num}`;
                } else if (email.includes('mh')) {
                    const num = email.match(/mh(\d+)/)?.[1] || '1';
                    userId = `mock-provider-mh-${num}`;
                    tokenAlias = `DOC MH ${num}`;
                } else if (email.includes('medtech')) {
                    const num = email.match(/medtech(\d+)/)?.[1] || '1';
                    userId = `mock-provider-mt-${num}`;
                    tokenAlias = `TECH ${num}`;
                } else if (email.includes('pt')) {
                    userId = 'mock-provider-pt-1';
                    tokenAlias = 'DR. PT 1';
                }
            } else if (isPatient) {
                const match = email.match(/patient(\d{3})/);
                if (match) {
                    const num = match[1];
                    userId = `mock-user-${num}`;
                    tokenAlias = `PATIENT ${num}`;
                }
            }

            const user = {
                id: userId,
                email,
                user_metadata: { token_alias: tokenAlias }
            };
            const session = {
                access_token: 'mock-token',
                user
            };

            mockSession = session;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('PROJECT_VECTOR_MOCK_SESSION', JSON.stringify(session));
            }

            notifyListeners('SIGNED_IN', session);

            return {
                data: { user, session },
                error: null
            };
        },
        signUp: async ({ email, options }: any) => {
            const user = { id: 'mock-user-123', email, user_metadata: options?.data };
            const session = { access_token: 'mock-token', user };
            mockSession = session;
            notifyListeners('SIGNED_IN', session);
            return { data: { user, session }, error: null };
        },
        signOut: async () => {
            mockSession = null;
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('PROJECT_VECTOR_MOCK_SESSION');
            }
            notifyListeners('SIGNED_OUT', null);
            return { error: null };
        },
        onAuthStateChange: (callback: any) => {
            mockAuthListeners.push(callback);
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            const idx = mockAuthListeners.indexOf(callback);
                            if (idx > -1) mockAuthListeners.splice(idx, 1);
                        }
                    }
                }
            };
        }
    },
    from: (table: string) => ({
        select: () => ({
            eq: (_col: string, val: string) => ({
                single: () => {
                    if (table === 'users') {
                        if (val === 'mock-admin-alex') return { data: { role: 'admin' }, error: null };
                        
                        // Expanded Provider Role Resolution
                        if (val.includes('provider')) {
                            let role = 'provider';
                            let st = 'MH_GREEN';
                            
                            if (val.includes('mh')) st = 'MH_GREEN';
                            else if (val.includes('doc')) st = 'PRIMARY_BLUE';
                            else if (val.includes('pt')) st = 'PT_GOLD';
                            else if (val.includes('mt')) st = 'TECH_PURPLE';
                            
                            return { data: { role, service_type: st }, error: null };
                        }
                        
                        return { data: { role: 'member' }, error: null };
                    }
                    return { data: null, error: null };
                },
                gte: () => ({ lte: () => ({ order: () => ({ data: [], error: null }) }) })
            }),
            order: () => ({ data: [], error: null }),
            gte: () => ({ lte: () => ({ order: () => ({ data: [], error: null }) }) })
        }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) })
    }),
    rpc: async (_fn: string, args: any) => {
        logger.debug('MOCK', `RPC Call: ${_fn}`, args);
        return { data: null, error: null };
    }
};

export const supabase = (IS_MOCK ? (mockSupabase as unknown as SupabaseClient<Database>) : client!) as SupabaseClient<Database>;

if (IS_MOCK) {
    logger.warn('supabase', '⚠️ RUNNING IN MOCK MODE: Supabase keys missing. Using fake backend.');
}
