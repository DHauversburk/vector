import { useState, useEffect } from 'react';

export interface BootStep {
    id: string;
    loadingText: string;
    delay: number;
    duration: number;
}

export const BOOT_SEQUENCE: BootStep[] = [
    { id: 'background', loadingText: 'INITIALIZING DISPLAY...', delay: 0, duration: 400 },
    { id: 'logo', loadingText: 'LOADING SECURITY MODULE...', delay: 400, duration: 500 },
    { id: 'title', loadingText: 'ESTABLISHING IDENTITY...', delay: 800, duration: 400 },
    { id: 'card', loadingText: 'PREPARING INTERFACE...', delay: 1200, duration: 500 },
    { id: 'inputs', loadingText: 'INITIALIZING INPUT LAYER...', delay: 1700, duration: 400 },
    { id: 'button', loadingText: 'ARMING AUTHENTICATION...', delay: 2100, duration: 400 },
    { id: 'footer', loadingText: 'VERIFYING PROTOCOLS...', delay: 2500, duration: 400 },
    { id: 'complete', loadingText: 'SYSTEM READY', delay: 2900, duration: 300 },
];

export function useBootSequence() {
    const [bootPhase, setBootPhase] = useState<string>('init');
    const [loadedElements, setLoadedElements] = useState<Set<string>>(new Set());
    const [currentLoadingText, setCurrentLoadingText] = useState('');
    const [bootComplete, setBootComplete] = useState(false);
    const [showBootSequence, setShowBootSequence] = useState(true);

    // Check if boot sequence should be skipped
    useEffect(() => {
        const hasBooted = sessionStorage.getItem('VECTOR_BOOTED_THIS_SESSION');
        if (hasBooted) {
            setShowBootSequence(false);
            setBootComplete(true);
            const allIds = new Set(BOOT_SEQUENCE.map(step => step.id));
            setLoadedElements(allIds);
        }
    }, []);

    // Run boot sequence
    useEffect(() => {
        if (!showBootSequence || bootComplete && loadedElements.size === BOOT_SEQUENCE.length) return;

        const timers: number[] = [];

        BOOT_SEQUENCE.forEach((step) => {
            // Show loading text
            const textTimer = window.setTimeout(() => {
                setCurrentLoadingText(step.loadingText);
                setBootPhase(step.id);
            }, step.delay);
            timers.push(textTimer);

            // Mark element as loaded after its duration
            const loadTimer = window.setTimeout(() => {
                setLoadedElements(prev => new Set([...prev, step.id]));

                if (step.id === 'complete') {
                    setBootComplete(true);
                    sessionStorage.setItem('VECTOR_BOOTED_THIS_SESSION', 'true');
                    window.setTimeout(() => {
                        setShowBootSequence(false);
                    }, 500);
                }
            }, step.delay + step.duration);
            timers.push(loadTimer);
        });

        return () => timers.forEach(clearTimeout);
    }, [showBootSequence]);

    const isLoaded = (id: string) => loadedElements.has(id);
    const isLoading = (id: string) => bootPhase === id && !loadedElements.has(id);

    return {
        bootPhase,
        loadedElements,
        currentLoadingText,
        bootComplete,
        showBootSequence,
        isLoaded,
        isLoading
    };
}
