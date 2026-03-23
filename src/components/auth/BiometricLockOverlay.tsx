import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldAlert, Loader2, ChevronRight } from 'lucide-react';
import { webauthn } from '../../lib/webauthn';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface BiometricLockOverlayProps {
    isOpen: boolean;
    onUnlock: () => void;
    onSignOut: () => void;
    userName?: string;
}

/**
 * BiometricLockOverlay - A high-security, cinematic lock screen for the VECTOR PWA.
 * Features WebAuthn (FaceID/TouchID) re-authentication.
 */
export const BiometricLockOverlay: React.FC<BiometricLockOverlayProps> = ({
    isOpen,
    onUnlock,
    onSignOut,
    userName = 'OPERATOR'
}) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial attempt on open
    useEffect(() => {
        if (isOpen) {
            handleUnlock();
        }
    }, [isOpen]);

    const handleUnlock = async () => {
        setError(null);
        setIsAuthenticating(true);
        try {
            const success = await webauthn.authenticate();
            if (success) {
                onUnlock();
            } else {
                setError('AUTHENTICATION_REJECTED');
            }
        } catch (err) {
            setError('SENSOR_TIMEOUT_OR_ERROR');
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 overflow-hidden select-none">
            {/* AMBIENT BACKGROUND EFFECTS */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-[80px]"></div>
                
                {/* CYBER SCAN HUD ELEMENT */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-indigo-400 animate-scanline"></div>
                    <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>
            </div>

            <div className="relative w-full max-w-sm flex flex-col items-center">
                {/* SHIELD LOGO / SENSOR ICON */}
                <div className="relative mb-8 group">
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-2xl transition-all duration-700",
                        isAuthenticating ? "bg-indigo-500/40" : "bg-indigo-500/20"
                    )}></div>
                    <div className={cn(
                        "relative w-24 h-24 rounded-full bg-slate-900 border-2 flex items-center justify-center shadow-2xl transition-all duration-500",
                        isAuthenticating ? "border-indigo-400 shadow-indigo-500/40 scale-105" : "border-slate-800",
                        error && "border-rose-500/50 shadow-rose-500/20"
                    )}>
                        {isAuthenticating ? (
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                        ) : error ? (
                            <ShieldAlert className="w-10 h-10 text-rose-500" />
                        ) : (
                            <Fingerprint className="w-10 h-10 text-indigo-400" />
                        )}
                        
                        {/* SCANNING RING */}
                        {isAuthenticating && (
                            <div className="absolute inset-[-8px] border-t-2 border-indigo-400 rounded-full animate-spin-slow"></div>
                        )}
                    </div>
                </div>

                {/* TEXT CONTENT */}
                <div className="text-center space-y-2 mb-12">
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter">System Locked</h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userName} - ENCRYPTED SESSION</p>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="w-full space-y-4">
                    <Button
                        onClick={handleUnlock}
                        disabled={isAuthenticating}
                        className="w-full h-14 bg-white hover:bg-indigo-50 text-slate-900 rounded-2xl flex items-center justify-between px-6 group transition-all"
                    >
                        <span className="text-xs font-black uppercase tracking-widest">Verify Identity</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={onSignOut}
                        className="w-full text-slate-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/5"
                    >
                        Terminate Session
                    </Button>
                </div>

                {/* SECURITY FOOTER */}
                <div className="mt-16 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full">
                        <Lock className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">FIPS-140 COMPLIANT AUTHENTICATION LAYER</span>
                    </div>
                    {error && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase animate-in fade-in slide-in-from-bottom-1">
                            {error === 'AUTHENTICATION_REJECTED' ? 'Verification Rejected. Please try again.' : 'Hardware Sensor Error. Use manual login?'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
