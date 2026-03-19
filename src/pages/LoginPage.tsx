/**
 * LoginPage - Dramatic enterprise login with choreographed reveal
 * 
 * @component
 * @description The primary authentication entry point for Project Vector.
 * Features a cinematic boot sequence where UI elements "load in" with
 * placeholder text that transforms into the actual component.
 * 
 * @troubleshooting
 * - Animation not playing: Check if prefers-reduced-motion is enabled
 * - Elements not appearing: Verify animation delays are sequential
 * - Login failing: Check console for API errors, verify mock mode
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { supabase, IS_MOCK } from '../lib/supabase';
import { webauthn } from '../lib/webauthn';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { TokenHelpModal } from '../components/ui/TokenHelpModal';

// Extracted Auth Components
import { AuthForm, LoadingPlaceholder } from '../components/auth/AuthForm';
import { PinVerification } from '../components/auth/PinVerification';
import { PinSetup } from '../components/auth/PinSetup';
import { ResetFlow } from '../components/auth/ResetFlow';

interface AuthenticationError {
    message: string;
}

// Boot sequence configuration
interface BootStep {
    id: string;
    loadingText: string;
    delay: number;
    duration: number;
}

const bootSequence: BootStep[] = [
    { id: 'background', loadingText: 'INITIALIZING DISPLAY...', delay: 0, duration: 400 },
    { id: 'logo', loadingText: 'LOADING SECURITY MODULE...', delay: 400, duration: 500 },
    { id: 'title', loadingText: 'ESTABLISHING IDENTITY...', delay: 800, duration: 400 },
    { id: 'card', loadingText: 'PREPARING INTERFACE...', delay: 1200, duration: 500 },
    { id: 'inputs', loadingText: 'INITIALIZING INPUT LAYER...', delay: 1700, duration: 400 },
    { id: 'button', loadingText: 'ARMING AUTHENTICATION...', delay: 2100, duration: 400 },
    { id: 'footer', loadingText: 'VERIFYING PROTOCOLS...', delay: 2500, duration: 400 },
    { id: 'complete', loadingText: 'SYSTEM READY', delay: 2900, duration: 300 },
];

export default function LoginPage() {
    // Boot sequence state
    const [bootPhase, setBootPhase] = useState<string>('init');
    const [loadedElements, setLoadedElements] = useState<Set<string>>(new Set());
    const [currentLoadingText, setCurrentLoadingText] = useState('');
    const [bootComplete, setBootComplete] = useState(false);
    const [showBootSequence, setShowBootSequence] = useState(true);

    // Auth state
    const [stage, setStage] = useState<'auth' | 'pin' | 'setup' | 'reset'>('auth');
    const [mode, setMode] = useState<'token' | 'email'>('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const tokenInputRef = useRef<HTMLInputElement>(null);
    const [showTokenHelp, setShowTokenHelp] = useState(false);

    const { session, verifyPin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if boot sequence should be skipped
    useEffect(() => {
        const hasBooted = sessionStorage.getItem('VECTOR_BOOTED_THIS_SESSION');
        if (hasBooted) {
            setShowBootSequence(false);
            setBootComplete(true);
            bootSequence.forEach(step => {
                setLoadedElements(prev => new Set([...prev, step.id]));
            });
        }
    }, []);

    // Handle all URL parameters (mode, token, help)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlMode = params.get('mode');
        const urlToken = params.get('token');
        const helpParam = params.get('help');

        if (urlMode === 'patient') {
            setMode('token');
        } else if (urlMode === 'staff' || urlMode === 'admin') {
            setMode('email');
        }

        if (urlToken) {
            setToken(urlToken);
            setMode('token');
        }

        if (helpParam === 'token') {
            setMode('token');
            setTimeout(() => setShowTokenHelp(true), 500);
        }
    }, [location]);

    // Auto-focus token input when boot completes
    useEffect(() => {
        if (bootComplete && stage === 'auth' && mode === 'token') {
            const focusToken = () => {
                if (tokenInputRef.current) {
                    tokenInputRef.current.focus();
                }
            };
            // Multiple attempts to handle render timing
            const timers = [0, 50, 100, 200, 400].map(delay =>
                setTimeout(focusToken, delay)
            );
            return () => timers.forEach(clearTimeout);
        }
    }, [bootComplete, stage, mode]);

    // Run boot sequence
    useEffect(() => {
        if (!showBootSequence) return;

        bootSequence.forEach((step) => {
            // Show loading text
            setTimeout(() => {
                setCurrentLoadingText(step.loadingText);
                setBootPhase(step.id);
            }, step.delay);

            // Mark element as loaded after its duration
            setTimeout(() => {
                setLoadedElements(prev => new Set([...prev, step.id]));

                if (step.id === 'complete') {
                    setBootComplete(true);
                    sessionStorage.setItem('VECTOR_BOOTED_THIS_SESSION', 'true');
                    setTimeout(() => {
                        setShowBootSequence(false);
                    }, 500);
                }
            }, step.delay + step.duration);
        });
    }, [showBootSequence]);

    // Auth logic (unchanged)
    const checkPinRequirement = async (uid: string) => {
        try {
            setCurrentUserId(uid);
            const savedPin = await api.getTacticalPin(uid);
            if (savedPin) {
                setStage('pin');
            } else {
                setStage('setup');
            }
        } catch {
            setStage('setup');
        }
    };

    const handlePinComplete = async (enteredPin: string) => {
        setPinLoading(true);
        setError('');
        try {
            if (!currentUserId) throw new Error('SESSION INVALID');
            const isValid = await api.verifyTacticalPin(currentUserId, enteredPin);
            if (isValid) {
                verifyPin();
                navigate('/dashboard');
            } else {
                setError('ACCESS DENIED: INVALID SECURITY PIN');
                setPinLoading(false);
            }
        } catch {
            setError('PIN VERIFICATION ERROR');
            setPinLoading(false);
        }
    };

    const handlePinSetup = async (newPin: string) => {
        setPinLoading(true);
        try {
            if (!currentUserId) throw new Error('SESSION INVALID');
            await api.setTacticalPin(currentUserId, newPin);
            verifyPin();
            navigate('/dashboard');
        } catch {
            setError('FAILED TO INITIALIZE SECURITY PIN');
            setPinLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            checkPinRequirement(session.user.id);
        }
    }, [session]);

    const handleReset = (resetToken: string) => {
        if (resetToken === 'VECTOR-ADMIN-RESET' || resetToken === '0000') {
            setStage('setup');
            setError('');
        } else {
            setError('INVALID RESET TOKEN');
        }
    };


    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let loginEmail = email;
            let loginPassword = password;

            if (mode === 'token') {
                // Legacy mock token map (backward compat for testers with old tokens)
                const legacyTokenMap: Record<string, string> = {
                    'M-8821-X4': 'patient001@vector.mil',
                    'M-3392-L9': 'patient002@vector.mil',
                    'M-1102-P2': 'patient003@vector.mil',
                    'PATIENT-01': 'patient001@vector.mil',
                    'PATIENT-02': 'patient002@vector.mil',
                    'SARAH': 'patient003@vector.mil',
                    'P-MH-9921': 'mh.provider1@vector.mil',
                    'DOC-MH': 'mh.provider1@vector.mil',
                    'DOC-FAM': 'doc.provider1@vector.mil',
                    'DOC-PT': 'pt.provider1@vector.mil',
                    'R-TEAM-99X2': 'doc.provider1@vector.mil',
                    'B-TEAM-77K1': 'mh.provider2@vector.mil',
                    'CMD-ALPHA-1': 'admin@vector.mil',
                    'COMMAND-01': 'admin@vector.mil',
                };

                const key = token.trim().toUpperCase();

                // Resolve token → email
                const legacyEmail = legacyTokenMap[key];
                if (legacyEmail) {
                    loginEmail = legacyEmail;
                } else if (/^M-\d{1,3}$/.test(key)) {
                    // Patient token: M-1 through M-300 → patient001@vector.mil
                    const num = key.replace('M-', '');
                    loginEmail = `patient${num.padStart(3, '0')}@vector.mil`;
                } else if (/^P-(MH|DOC|MT|PT)-\d{3}$/.test(key)) {
                    // Provider token: P-MH-001 → mh.provider1@vector.mil etc.
                    const match = key.match(/^P-(MH|DOC|MT|PT)-(\d{3})$/);
                    if (match) {
                        const typeMap: Record<string, string> = {
                            'MH': 'mh.provider',
                            'DOC': 'doc.provider',
                            'MT': 'medtech',
                            'PT': 'pt.provider'
                        };
                        const prefix = typeMap[match[1]] || match[1].toLowerCase();
                        loginEmail = `${prefix}${parseInt(match[2])}@vector.mil`;
                    } else {
                        loginEmail = `${key.toLowerCase()}@vector.mil`;
                    }
                } else {
                    // Generic fallback: treat token as email prefix
                    loginEmail = `${key.toLowerCase().replace(/\s+/g, '')}@vector.mil`;
                }
                loginPassword = 'VectorBeta2026!';
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
        } catch (err) {
            const error = err as AuthenticationError;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [email, password, mode, token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('autosubmit') === 'true' && token) {
            const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
            handleLogin(fakeEvent);
        }
    }, [token, location, handleLogin]);

    const handleBiometric = async () => {
        try {
            setError('');
            const isSupported = await webauthn.isSupported();
            if (!isSupported) {
                setError('BIO-SENSOR UNAVAILABLE ON THIS TERMINAL');
                return;
            }
            const assertion = await webauthn.authenticate();
            if (assertion) {
                setLoading(true);
                setTimeout(async () => {
                    await checkPinRequirement('BIOMETRIC-USER-01');
                    setLoading(false);
                }, 800);
            }
        } catch (err) {
            const error = err as AuthenticationError;
            setError(error.message || 'BIOMETRIC LOGIN FAILED');
        }
    };

    // Helper to check if an element should be visible
    const isLoaded = (id: string) => loadedElements.has(id);
    const isLoading = (id: string) => bootPhase === id && !loadedElements.has(id);



    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* ============================================================
                BACKGROUND - Loads first
                ============================================================ */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${isLoaded('background') ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

                {/* Animated gradient orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(217, 91%, 60%) 0%, transparent 70%)', animationDuration: '4s' }}
                    />
                    <div
                        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(262, 83%, 58%) 0%, transparent 70%)', animationDuration: '5s', animationDelay: '1s' }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(330, 81%, 60%) 0%, transparent 70%)', animationDuration: '6s', animationDelay: '2s' }}
                    />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 vector-gradient" />
            </div>

            {/* Background loading state */}
            {!isLoaded('background') && (
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                    <LoadingPlaceholder text={currentLoadingText || 'INITIALIZING...'} visible={true} />
                </div>
            )}

            {/* ============================================================
                MAIN CONTENT
                ============================================================ */}
            <div className="w-full max-w-md relative z-10">

                {/* ============================================================
                    LOGO - Loads second
                    ============================================================ */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-6 h-24">
                        {/* Loading state */}
                        {isLoading('logo') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                            </div>
                        )}

                        {/* Loaded state */}
                        <div className={`transition-all duration-700 ${isLoaded('logo') ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                            <div className="absolute inset-0 vector-gradient rounded-2xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center shadow-2xl">
                                {stage === 'auth' ? (
                                    <img src="/pwa-192x192.png" alt="Vector" className="w-12 h-12 drop-shadow-lg" />
                                ) : (
                                    <Lock className="w-10 h-10 text-blue-400 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ============================================================
                        TITLE - Loads third
                        ============================================================ */}
                    <div className="h-16 relative">
                        {/* Loading state */}
                        {isLoading('title') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                            </div>
                        )}

                        {/* Loaded state */}
                        <div className={`transition-all duration-700 ${isLoaded('title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h1 className="text-3xl font-black tracking-[0.2em] uppercase mb-2 vector-gradient-text">
                                Project Vector
                            </h1>
                            <div className="flex items-center justify-center gap-3">
                                <span className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                                    {stage === 'auth' ? 'Secure Clinical Access' :
                                        stage === 'pin' ? 'Security Verification' :
                                            'Initialize Security'}
                                </span>
                                <span className="h-px w-8 bg-gradient-to-l from-transparent to-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    LOGIN CARD - Loads fourth
                    ============================================================ */}
                <div className="relative min-h-[400px]">
                    {/* Loading state */}
                    {isLoading('card') && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LoadingPlaceholder text={currentLoadingText} visible={true} />
                        </div>
                    )}

                    {/* Card container */}
                    <div className={`transition-all duration-700 ${isLoaded('card') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="absolute -inset-1 vector-gradient rounded-3xl blur-lg opacity-20" />

                        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">

                            {stage === 'auth' ? (
                                <AuthForm
                                    mode={mode}
                                    setMode={setMode}
                                    email={email}
                                    setEmail={setEmail}
                                    password={password}
                                    setPassword={setPassword}
                                    token={token}
                                    setToken={setToken}
                                    handleLogin={handleLogin}
                                    handleBiometric={handleBiometric}
                                    loading={loading}
                                    error={error}
                                    bootComplete={bootComplete}
                                    setShowTokenHelp={setShowTokenHelp}
                                    tokenInputRef={tokenInputRef}
                                    isLoading={isLoading}
                                    isLoaded={isLoaded}
                                    currentLoadingText={currentLoadingText}
                                />
                            ) : stage === 'pin' ? (
                                <PinVerification
                                    error={error}
                                    pinLoading={pinLoading}
                                    onComplete={handlePinComplete}
                                />
                            ) : stage === 'reset' ? (
                                <ResetFlow
                                    error={error}
                                    handleReset={handleReset}
                                    onCancel={() => setStage('auth')}
                                />
                            ) : (
                                <PinSetup
                                    error={error}
                                    pinLoading={pinLoading}
                                    onComplete={handlePinSetup}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* PIN Recovery Link */}
                {stage === 'pin' && (
                    <button
                        onClick={() => {
                            setStage('reset');
                            setError('');
                        }}
                        className="w-full mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-blue-400 transition-colors"
                    >
                        Forgot PIN? Recover Access
                    </button>
                )}

                {/* Footer Status - Shows after complete */}
                <div className={`mt-8 text-center space-y-3 transition-all duration-700 ${isLoaded('complete') ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {bootComplete ? 'Authorized Use Only • Public Access Restricted • v2.0.0-beta' : ''}
                    </p>
                    <div
                        className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full ${IS_MOCK
                            ? 'text-amber-400 bg-amber-950/50 border border-amber-900/50'
                            : 'text-emerald-400 bg-emerald-950/50 border border-emerald-900/50'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${IS_MOCK ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                        {IS_MOCK ? 'Simulation Mode' : 'Live System'}
                    </div>

                    {IS_MOCK && bootComplete && (
                        <button
                            onClick={() => {
                                if (confirm('Reset all demo data? This will clear appointments and reload clean mock data.')) {
                                    api.mockStore.reset();
                                    window.location.reload();
                                }
                            }}
                            className="block mx-auto mt-3 px-4 py-2 border border-red-900/50 rounded-lg text-xs font-black uppercase tracking-widest text-red-400 bg-red-950/30 hover:bg-red-950/50 active:scale-95 transition-all"
                        >
                            Reset Demo Data
                        </button>
                    )}
                </div>

                {/* Boot complete indicator */}
                {bootComplete && !showBootSequence && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 text-emerald-400 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">System Ready</span>
                    </div>
                )}
            </div>

            {/* Token Help Modal */}
            <TokenHelpModal
                isOpen={showTokenHelp}
                onClose={() => setShowTokenHelp(false)}
            />
        </div>
    );
}
