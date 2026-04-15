/**
 * useBootSequence — instant-complete stub.
 *
 * Sprint 14 streamline pass: the original implementation animated a
 * staggered ~3.2s "ARMING AUTHENTICATION..." sequence on the LoginPage,
 * which delayed every first-time visit for no functional reason. The hook
 * API is preserved (LoginPage + AuthForm consume `isLoaded`, `isLoading`,
 * `currentLoadingText`, `bootComplete`, `showBootSequence`) so callers
 * don't need to change. All elements report loaded immediately.
 *
 * If a future sprint wants a real loading indicator it should be tied to
 * actual async work (e.g. Supabase session fetch), not setTimeout theatre.
 */

import { useMemo } from 'react'

export interface BootStep {
  id: string
  loadingText: string
  delay: number
  duration: number
}

// Element IDs preserved for any consumer that walks them.
export const BOOT_SEQUENCE: BootStep[] = [
  { id: 'background', loadingText: '', delay: 0, duration: 0 },
  { id: 'logo', loadingText: '', delay: 0, duration: 0 },
  { id: 'title', loadingText: '', delay: 0, duration: 0 },
  { id: 'card', loadingText: '', delay: 0, duration: 0 },
  { id: 'inputs', loadingText: '', delay: 0, duration: 0 },
  { id: 'button', loadingText: '', delay: 0, duration: 0 },
  { id: 'footer', loadingText: '', delay: 0, duration: 0 },
  { id: 'complete', loadingText: '', delay: 0, duration: 0 },
]

export function useBootSequence() {
  const loadedElements = useMemo(() => new Set(BOOT_SEQUENCE.map((s) => s.id)), [])

  return {
    bootPhase: 'complete',
    loadedElements,
    currentLoadingText: '',
    bootComplete: true,
    showBootSequence: false,
    isLoaded: (_id: string) => true,
    isLoading: (_id: string) => false,
  }
}
