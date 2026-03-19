
import { Shield } from 'lucide-react';
import { TacticalPinField } from '../ui/TacticalPinField';

interface PinVerificationProps {
    error: string;
    pinLoading: boolean;
    onComplete: (pin: string) => void;
}

export function PinVerification({ error, pinLoading, onComplete }: PinVerificationProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h2 className="text-lg font-black uppercase tracking-widest text-white mb-2">
                    Security PIN Required
                </h2>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Enter your 4-digit security code
                </p>
            </div>
            <TacticalPinField
                onComplete={onComplete}
                error={error}
                loading={pinLoading}
            />
        </div>
    );
}
