import { createContext, useEffect, useState, useCallback, useContext, type ReactNode } from 'react';
import { toast } from 'sonner';
import { OfflineQueue } from '../lib/offline/queue';
import { api } from '../lib/api';
import { logger } from '../lib/logger';

type MutationType = 
    | 'CREATE_NOTE' 
    | 'UPDATE_NOTE' 
    | 'ARCHIVE_NOTE' 
    | 'CREATE_APPOINTMENT' 
    | 'CANCEL_APPOINTMENT' 
    | 'LINK_NOTE_FOLLOWUP' 
    | 'TOGGLE_SLOT_BLOCK' 
    | 'CREATE_HELP_REQUEST'
    | 'BOOK_SLOT'
    | 'JOIN_WAITLIST'
    | 'RESCHEDULE_SWAP'
    | 'SUBMIT_FEEDBACK'
    | 'UPDATE_APPOINTMENT_STATUS';



interface OfflineContextType {
    isOnline: boolean;
    pendingCount: number;
    executeMutation: (type: MutationType, payload: any, optimisticUpdate?: () => void) => Promise<any>;
    syncNow: () => Promise<void>;
}

export const OfflineContext = createContext<OfflineContextType | null>(null);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Monitor Network Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Connection restored. Syncing...", { id: 'online-toast' });
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.message("You are offline. Changes will be queued.", { icon: '📶', id: 'offline-toast' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial Count Load
        OfflineQueue.getCount().then(setPendingCount);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sync Engine
    const processQueue = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const queue = await OfflineQueue.getAll();
            if (queue.length === 0) {
                setPendingCount(0);
                setIsSyncing(false);
                return;
            }

            for (const req of queue) {
                try {
                    logger.debug('Sync', `Processing ${req.operationName}...`, req.body);
                    await performOperation(req.operationName as MutationType, req.body);
                    if (req.id) await OfflineQueue.remove(req.id);
                } catch (error) {
                    logger.error('Sync', `Failed ${req.operationName}`, error);
                    // Decide whether to remove or retry. For now, keep it if it's a network error, remove if logic error?
                    // Assuming retry logic happens elsewhere or manual.
                }
            }

            // Refresh count
            const count = await OfflineQueue.getCount();
            setPendingCount(count);

            if (count === 0) {
                toast.success("All offline changes synced!");
            }
        } catch (error) {
            logger.error('OfflineContext', "Sync Engine Error:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    // Operation Router
    const performOperation = async (type: MutationType, payload: any) => {
        switch (type) {
            case 'CREATE_NOTE':
                return await api.addEncounterNote(payload);
            case 'UPDATE_NOTE':
                return await api.updateNote(payload.id, payload.updates);
            case 'ARCHIVE_NOTE':
                return await api.archiveNote(payload.noteId);
            case 'CREATE_APPOINTMENT':
                return await api.createAppointment(payload);
            case 'CANCEL_APPOINTMENT':
                return await api.cancelAppointment(payload.id, payload.reason);
            case 'LINK_NOTE_FOLLOWUP':
                return await api.linkNoteToFollowUp(payload.noteId, payload.appointmentId);
            case 'TOGGLE_SLOT_BLOCK':
                return await api.toggleSlotBlock(payload.id, payload.isBlocked);
            case 'CREATE_HELP_REQUEST':
                return await api.createHelpRequest(payload);
            case 'BOOK_SLOT':
                return await api.bookSlot(payload.slotId, payload.notes);
            case 'JOIN_WAITLIST':
                return await api.joinWaitlist(payload.providerId, payload.serviceType, payload.note, payload.preferredDays);
            case 'RESCHEDULE_SWAP':
                return await api.rescheduleAppointmentSwap(payload.oldApptId, payload.newSlotId);
            case 'SUBMIT_FEEDBACK':
                return await api.submitFeedback(payload.appointmentId, payload.rating, payload.comment);
            case 'UPDATE_APPOINTMENT_STATUS':
                return await api.updateAppointmentStatus(payload.id, payload.status);

            default:
                throw new Error(`Unknown mutation type: ${type}`);
        }
    };

    const executeMutation = async (type: MutationType, payload: any, optimisticUpdate?: () => void): Promise<any> => {
        if (isOnline) {
            try {
                const result = await performOperation(type, payload);
                if (optimisticUpdate) optimisticUpdate();
                return result;
            } catch (error) {
                logger.error('OfflineContext', "Online mutation failed:", error);
                throw error;
            }
        } else {
            // Offline: Enqueue
            logger.debug('Offline', `Queueing ${type}`);
            await OfflineQueue.enqueue({
                type: 'POST', // Simplified for now
                url: type, // Using URL field to store Operation Name
                body: payload,
                operationName: type
            });

            // Optimistic UI Update
            if (optimisticUpdate) optimisticUpdate();

            // Update Count
            OfflineQueue.getCount().then(setPendingCount);

            // Return fake success
            return { offline: true, ...payload };
        }
    };

    return (
        <OfflineContext.Provider value={{ isOnline, pendingCount, executeMutation, syncNow: processQueue }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};
