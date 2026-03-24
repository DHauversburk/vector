import { useState, useCallback } from 'react';
import { addWeeks, subWeeks, addDays, addMonths, subMonths } from 'date-fns';
import { type ViewMode } from '../../lib/api';

export function useScheduleState() {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const navigate = useCallback((direction: 'prev' | 'next') => {
        if (viewMode === 'week') {
            setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
        } else if (viewMode === 'month') {
            setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
        }
    }, [viewMode]);

    return {
        viewMode,
        setViewMode,
        currentDate,
        setCurrentDate,
        navigate
    };
}
