import { useEffect, useState, useCallback } from 'react';
import { api, type Appointment, type EncounterNote } from '../lib/api';
import { useAuth } from './useAuth';
import { logger } from '../lib/logger';
import { toast } from 'sonner';

export function useProviderOverview() {
    const { user } = useAuth();
    const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
    const [helpRequestCount, setHelpRequestCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; apptId: string | null }>({ open: false, apptId: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [actionNotes, setActionNotes] = useState<EncounterNote[]>([]);

    const loadData = useCallback(async () => {
        if (!user) return;
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        try {
            const [schedule, requests, notes] = await Promise.all([
                api.getProviderSchedule(user.id, start.toISOString(), end.toISOString()),
                api.getPendingHelpRequests(),
                api.getProviderEncounterNotes(20, false)
            ]);
            setTodayAppts(schedule.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
            setHelpRequestCount(requests.length);
            setActionNotes(notes.filter(n => n.status === 'requires_action').slice(0, 5));
        } catch (err) {
            logger.error('useProviderOverview', "Failed to load overview data", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleNoShow = async () => {
        if (!confirmModal.apptId) return;
        setConfirmLoading(true);
        try {
            await api.providerCancelAppointment(confirmModal.apptId, 'Patient No-Show recorded by provider');
            toast.success('Patient marked as no-show');
            await loadData();
            setConfirmModal({ open: false, apptId: null });
        } catch (err) {
            logger.error('useProviderOverview', err);
            toast.error('Failed to update status');
        } finally {
            setConfirmLoading(false);
        }
    };

    return {
        todayAppts,
        helpRequestCount,
        loading,
        searchTerm,
        setSearchTerm,
        confirmModal,
        setConfirmModal,
        confirmLoading,
        actionNotes,
        handleNoShow,
        refresh: loadData
    };
}
