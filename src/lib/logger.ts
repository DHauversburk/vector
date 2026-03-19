/**
 * VECTOR — Environment-Aware Logger
 * 
 * Provides structured, level-gated logging that suppresses
 * debug/info messages in production builds while always
 * forwarding warnings and errors.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('SlotGrid', 'rendering', { count: 12 });
 *   logger.warn('Auth', 'Session nearing expiry');
 *   logger.error('API', 'Fetch failed', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const IS_DEV = import.meta.env.DEV;

/** Minimum level that actually emits output */
const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function formatTag(module: string): string {
    return `[V:${module}]`;
}

export const logger = {
    /** Verbose development-only logs (stripped in prod) */
    debug(module: string, message: string, ...data: unknown[]) {
        if (!shouldLog('debug')) return;
        console.log(`%c${formatTag(module)}%c ${message}`, 'color:#6366f1;font-weight:bold', 'color:inherit', ...data);
    },

    /** General informational messages (stripped in prod) */
    info(module: string, message: string, ...data: unknown[]) {
        if (!shouldLog('info')) return;
        console.info(`${formatTag(module)} ${message}`, ...data);
    },

    /** Warnings that indicate something unexpected (always logged) */
    warn(module: string, message: string, ...data: unknown[]) {
        if (!shouldLog('warn')) return;
        console.warn(`${formatTag(module)} ${message}`, ...data);
    },

    /** Errors that need attention (always logged) */
    error(module: string, message: string, ...data: unknown[]) {
        if (!shouldLog('error')) return;
        console.error(`${formatTag(module)} ${message}`, ...data);
    },

    /** Time a block of code (dev-only) */
    time(label: string) {
        if (IS_DEV) console.time(`[V] ${label}`);
    },

    timeEnd(label: string) {
        if (IS_DEV) console.timeEnd(`[V] ${label}`);
    },
};
