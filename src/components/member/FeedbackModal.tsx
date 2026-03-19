import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface FeedbackModalProps {
    isOpen: boolean;
    appointmentId: string | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function FeedbackModal({ isOpen, appointmentId, onClose, onSuccess }: FeedbackModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !appointmentId) return null;

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.submitFeedback(appointmentId, rating, comment);
            toast.success('Feedback Submitted.');
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit feedback.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 text-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Visit Feedback</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Secure confidential report</p>
                </div>

                <form onSubmit={submitFeedback} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center block">Effectiveness Index</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRating(r)}
                                    className={`w-10 h-10 rounded border text-xs font-black transition-all
                                        ${rating === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-inner' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Subjective Observations</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs font-bold text-slate-700 dark:text-slate-300 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add brief technical details or observations..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                        <Button type="submit" isLoading={loading} className="bg-indigo-600 text-[10px] font-black uppercase tracking-widest h-9 px-6 shadow-sm">Submit Feedback</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
