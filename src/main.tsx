import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase, IS_MOCK } from './lib/supabase'
import { logger } from './lib/logger'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

const IS_DEV_ENV = import.meta.env.DEV

// ── Sentry — initialise before any React rendering ───────────────────────────
// VITE_SENTRY_DSN must be set in production for telemetry to fire.
// When unset the SDK is loaded but all capture calls no-op, so no data leaves
// the browser and there is no runtime cost.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? '',
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' | 'production'
  release: import.meta.env.VITE_APP_VERSION, // set by CI on build

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // HIPAA-aligned: mask all text and block all media in session replays
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance: sample 100% of traces in dev, 10% in production
  // Override VITE_SENTRY_TRACES_SAMPLE_RATE for fine-grained control
  tracesSampleRate: IS_DEV_ENV
    ? 1.0
    : parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

  // Session Replay: record 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// ── Supabase debug utilities ──────────────────────────────────────────────────

// Extend Window interface for debug utilities
declare global {
  interface Window {
    supabase: typeof supabase
    toggleRealMode: () => void
  }
}

if (typeof window !== 'undefined') {
  window.supabase = supabase

  window.toggleRealMode = () => {
    logger.info('MODE', `Current mode: ${IS_MOCK ? 'MOCK' : 'LIVE'}`)
    logger.info('MODE', 'Mode is now controlled via VITE_FORCE_MOCK environment variable.')
    logger.info('MODE', 'Set VITE_FORCE_MOCK=true in .env for mock mode, remove it for live.')
  }

  logger.debug(
    'INIT',
    `[VECTOR] mode=${IS_MOCK ? 'MOCK' : 'LIVE'}; window.supabase available; window.toggleRealMode() for info.`,
  )
}

// ── React root ────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
