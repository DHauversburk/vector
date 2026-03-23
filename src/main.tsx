import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase, IS_MOCK } from './lib/supabase';
import { logger } from './lib/logger';

// Extend Window interface for debug utilities
declare global {
  interface Window {
    supabase: typeof supabase;
    toggleRealMode: () => void;
  }
}

// Expose Supabase for Debug/Console Scripts
if (typeof window !== 'undefined') {
  window.supabase = supabase;

  window.toggleRealMode = () => {
    logger.info('MODE', `Current mode: ${IS_MOCK ? 'MOCK' : 'LIVE'}`);
    logger.info('MODE', 'Mode is now controlled via VITE_FORCE_MOCK environment variable.');
    logger.info('MODE', 'Set VITE_FORCE_MOCK=true in .env for mock mode, remove it for live.');
  };

  logger.debug('INIT', `
    [VECTOR DEBUG] 🛸
    - Mode: ${IS_MOCK ? 'MOCK / SIMULATION' : 'LIVE PRODUCTION'}
    - window.supabase is now available.
    - Run window.toggleRealMode() for mode info.
    `);
}

import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
