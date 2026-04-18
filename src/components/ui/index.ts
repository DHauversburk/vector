/**
 * UI Component Library — Barrel Export
 *
 * Import from this file to get tree-shaking + consistent paths:
 *   import { Button, Card, Icon, Badge } from '../components/ui'
 *
 * Component catalogue:
 *   Primitives    : Badge, Button, Card (+ sub-parts), Icon, Input, Skeleton
 *   Feedback      : ErrorBoundary, LoadingState, ScreenReaderAnnouncer
 *   Overlays      : ConfirmModal, HelpRequestModal, KeyboardShortcutsModal,
 *                   QuickNoteModal, TokenHelpModal, WaitlistModal
 *   Data entry    : TacticalPinField
 *   Dashboard     : MetricCard, FeedbackWidget
 *   App infra     : CommandPalette, PWAManager
 */

// ── Primitives ────────────────────────────────────────────────────────────────
export * from './Badge'
export * from './Button'
export * from './Card'
export * from './Icon'
export * from './Input'
export * from './Skeleton'

// ── Feedback / status ─────────────────────────────────────────────────────────
export * from './ErrorBoundary'
export * from './LoadingState'
export * from './ScreenReaderAnnouncer'

// ── Overlay / modal ───────────────────────────────────────────────────────────
export * from './ConfirmModal'
export * from './HelpRequestModal'
export * from './KeyboardShortcutsModal'
export * from './QuickNoteModal'
export * from './TokenHelpModal'
export * from './WaitlistModal'

// ── Data entry ────────────────────────────────────────────────────────────────
export * from './TacticalPinField'

// ── Dashboard widgets ─────────────────────────────────────────────────────────
export * from './MetricCard'
export * from './FeedbackWidget'

// ── Application infrastructure ────────────────────────────────────────────────
export * from './CommandPalette'
export * from './PWAManager'
