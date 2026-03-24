import { Archive } from 'lucide-react';
import { Button } from '../ui/Button';

interface BulkArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string) => void;
    loading: boolean;
    date: string;
    setDate: (date: string) => void;
}

export function BulkArchiveModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    loading, 
    date, 
    setDate 
}: BulkArchiveModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Archive className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Archive Notes</h3>
                        <p className="text-sm text-slate-500">Archive all notes created before a date</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Archive Notes Created Before
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        Notes created before this date will be moved to the archive.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(date)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        disabled={loading || !date}
                    >
                        {loading ? 'Archiving...' : 'Archive Notes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
