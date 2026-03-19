import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShieldAlert } from 'lucide-react';
import { addDays } from 'date-fns';
import { api } from '../../lib/api';

interface ClearScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClearScheduleModal({ isOpen, onClose, onSuccess }: ClearScheduleModalProps) {
    const [genLoading, setGenLoading] = useState(false);
    const [cleanBooked, setCleanBooked] = useState(false);
    const [clearStart, setClearStart] = useState(new Date().toISOString().split('T')[0]);
    const [clearEnd, setClearEnd] = useState(addDays(new Date(), 14).toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleClear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cleanBooked && !confirm('DANGER: You are about to delete BOOKED appointments as well. This will cancel patients without notification. Are you sure?')) {
            return;
        }
        if (!confirm(`Clear schedule from ${clearStart} to ${clearEnd}?`)) return;

        setGenLoading(true);
        try {
            await api.clearSchedule(clearStart, clearEnd, cleanBooked);
            setCleanBooked(false);
            onSuccess();
            alert('Schedule cleared successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to clear schedule');
        } finally {
            setGenLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        Clear Schedule
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        Define the range to clear. By default, this only removes <span className="text-indigo-600 font-bold">OPEN</span> slots.
                    </p>
                    <form id="clear-form" onSubmit={handleClear} className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-500">From</label>
                                <Input type="date" value={clearStart} onChange={e => setClearStart(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-500">To</label>
                                <Input type="date" value={clearEnd} onChange={e => setClearEnd(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="cleanBooked"
                                checked={cleanBooked}
                                onChange={e => setCleanBooked(e.target.checked)}
                                className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="cleanBooked" className="text-xs font-bold text-red-600 select-none cursor-pointer">
                                ALSO CANCEL BOOKED APPOINTMENTS
                            </label>
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button form="clear-form" type="submit" variant="destructive" isLoading={genLoading}>
                        Confirm Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
