
import { Shield } from 'lucide-react';
import { TacticalPinField } from '../ui/TacticalPinField';

interface PinSetupProps {
    error: string;
    pinLoading: boolean;
    onComplete: (pin: string) => void;
}

export function PinSetup({ error, pinLoading, onComplete }: PinSetupProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full vector-gradient flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white mb-2">
                    Initialize Security
                </h2>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Create your 4-digit security PIN
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
