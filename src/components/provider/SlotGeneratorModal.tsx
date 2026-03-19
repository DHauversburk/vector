import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import { addDays } from 'date-fns';
import { api } from '../../lib/api';
import { logger } from '../../lib/logger';

interface SlotGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SlotGeneratorModal({ isOpen, onClose, onSuccess }: SlotGeneratorModalProps) {
    const [genLoading, setGenLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(addDays(new Date(), 14).toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [blockStartTime, setBlockStartTime] = useState('12:00');
    const [blockEndTime, setBlockEndTime] = useState('13:00');
    const [duration] = useState(45);
    const [breakTime] = useState(15);
    const [days] = useState<number[]>([1, 2, 3, 4, 5]);
    const [isBlockMode, setIsBlockMode] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenLoading(true);
        try {
            await api.generateSlots(
                startDate,
                endDate,
                isBlockMode ? blockStartTime : startTime,
                isBlockMode ? blockEndTime : endTime,
                isBlockMode ? 0 : duration,
                isBlockMode ? 0 : breakTime,
                days,
                isBlockMode,
                isBlockMode ? blockReason : null
            );
            onSuccess();
            toast.info(isBlockMode ? 'Block-out time added.' : 'Slots generated successfully.');
        } catch (error: unknown) {
            const err = error as Error;
            logger.error('SlotGeneratorModal', err);
            toast.error('Generation Failed: ' + err.message);
        } finally {
            setGenLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Availability Generator</h3>
                        <p className="text-xs text-slate-500 font-medium">Bulk create slots for your schedule</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <form id="gen-form" onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-slate-950" required />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="blockMode"
                                    checked={isBlockMode}
                                    onChange={(e) => setIsBlockMode(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="blockMode" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                    Block Out Time (Unavailable)
                                </label>
                            </div>

                            {!isBlockMode ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Daily Hours</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Block Time</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                        <Input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                    </div>
                                    <Input
                                        placeholder="Reason (e.g. Lunch, Admin)"
                                        value={blockReason}
                                        onChange={e => setBlockReason(e.target.value)}
                                        className="bg-white dark:bg-slate-950"
                                    />
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button form="gen-form" type="submit" isLoading={genLoading}>
                        {isBlockMode ? 'Add Block' : 'Generate Slots'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
