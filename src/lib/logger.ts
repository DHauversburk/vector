/**
 * VECTOR — Environment-Aware Logger
 *
 * Provides structured, level-gated logging that suppresses
 * debug/info messages in production builds while always
 * forwarding warnings and errors.
 *
 * Sentry integration: warn + error calls are automatically
 * forwarded to Sentry (captureMessage / captureException) when
 * VITE_SENTRY_DSN is configured and Sentry is initialized.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('SlotGrid', 'rendering', { count: 12 });
 *   logger.warn('Auth', 'Session nearing expiry');
 *   logger.error('API', 'Fetch failed', error);
 */

import * as Sentry from '@sentry/react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const IS_DEV = import.meta.env.DEV

/** Minimum level that actually emits output */
const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL]
}

function formatTag(module: string): string {
  return `[V:${module}]`
}

/**
 * Attempt to capture an error in Sentry.
 * No-ops gracefully when Sentry is not initialised (no DSN).
 */
function sentryCapture(
  module: string,
  message: unknown,
  data: unknown[],
  level: 'warning' | 'error',
) {
  try {
    // First item in data array might be the actual Error object
    const err = data.find((d): d is Error => d instanceof Error)
    Sentry.withScope((scope) => {
      scope.setTag('module', module)
      scope.setLevel(level)
      if (err) {
        Sentry.captureException(err)
      } else {
        Sentry.captureMessage(typeof message === 'string' ? message : String(message), level)
      }
    })
  } catch {
    // Sentry not initialised or threw — suppress silently
  }
}

export const logger = {
  /** Verbose development-only logs (stripped in prod) */
  debug(module: string, message: any, ...data: unknown[]) {
    if (!shouldLog('debug')) return
    console.log(
      `%c${formatTag(module)}%c ${message}`,
      'color:#6366f1;font-weight:bold',
      'color:inherit',
      ...data,
    )
  },

  /** General informational messages (stripped in prod) */
  info(module: string, message: any, ...data: unknown[]) {
    if (!shouldLog('info')) return
    console.info(`${formatTag(module)} ${message}`, ...data)
  },

  /** Warnings that indicate something unexpected (always logged + Sentry) */
  warn(module: string, message: any, ...data: unknown[]) {
    if (!shouldLog('warn')) return
    console.warn(`${formatTag(module)} ${message}`, ...data)
    sentryCapture(module, message, data, 'warning')
  },

  /** Errors that need attention (always logged + Sentry) */
  error(module: string, message: any, ...data: unknown[]) {
    if (!shouldLog('error')) return
    console.error(`${formatTag(module)} ${message}`, ...data)
    sentryCapture(module, message, data, 'error')
  },

  /** Time a block of code (dev-only) */
  time(label: string) {
    if (IS_DEV) console.time(`[V] ${label}`)
  },

  timeEnd(label: string) {
    if (IS_DEV) console.timeEnd(`[V] ${label}`)
  },
}
