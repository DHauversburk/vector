import { createContext, useEffect, useState, useCallback, useContext, type ReactNode } from 'react';
import { toast } from 'sonner';
import { OfflineQueue } from '../lib/offline/queue';
import { api } from '../lib/api';
import { logger } from '../lib/logger';

export type MutationType = 
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

    // Sync Engine with Exponential Backoff & Retry Policies
    const processQueue = useCallback(async () => {
        if (isSyncing || !isOnline) return;
        setIsSyncing(true);

        const MAX_RETRIES = 5;
        const BASE_WAIT = 30000; // 30 seconds

        try {
            const queue = await OfflineQueue.getAll();
            if (queue.length === 0) {
                setPendingCount(0);
                setIsSyncing(false);
                return;
            }

            const now = Date.now();

            for (const req of queue) {
                if (!req.id) continue;

                // Check Backoff: Only retry if enough time has passed
                if (req.retryCount > 0 && req.lastAttempt) {
                    const waitTime = Math.min(BASE_WAIT * Math.pow(2, req.retryCount - 1), 3600000); // Exponential wait capped at 1hr
                    if (now - req.lastAttempt < waitTime) {
                        logger.debug('Sync', `Backoff: Skipping ${req.operationName} (Retry #${req.retryCount} pending)`);
                        continue;
                    }
                }

                // Skip if reached max retries
                if (req.retryCount >= MAX_RETRIES) {
                    if (req.status !== 'failed') {
                        await OfflineQueue.update(req.id, { status: 'failed', error: 'MAX_RETRIES_REACHED' });
                    }
                    continue;
                }

                try {
                    logger.debug('Sync', `Processing ${req.operationName} (Attempt ${req.retryCount + 1})...`, req.body);
                    
                    // Update state to syncing
                    await OfflineQueue.update(req.id, { status: 'syncing', lastAttempt: Date.now() });
                    
                    await performOperation(req.operationName as MutationType, req.body);
                    
                    // Success! Remove from disk
                    await OfflineQueue.remove(req.id);
                } catch (error: any) {
                    logger.error('Sync', `Failed ${req.operationName}`, error);
                    
                    // Increment retry count and update status
                    await OfflineQueue.update(req.id, { 
                        status: 'pending', 
                        retryCount: req.retryCount + 1,
                        lastAttempt: Date.now(),
                        error: error.message || 'NETWORK_ERROR'
                    });

                    // If it's a 400-level error (not network/server), maybe fail it immediately?
                    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                        await OfflineQueue.update(req.id, { status: 'failed', retryCount: MAX_RETRIES });
                    }
                }
            }

            // Refresh count
            const count = await OfflineQueue.getCount();
            setPendingCount(count);
        } catch (error) {
            logger.error('OfflineContext', "Sync Engine Critical Error:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, isOnline]);

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
