/**
 * Icon — Standardised icon wrapper enforcing the VECTOR icon size convention.
 *
 * Size scale (matches 8px grid):
 *   sm  → 14 px  (w-3.5 h-3.5)  — inline / badge icons
 *   md  → 16 px  (w-4 h-4)      — default; buttons, list items
 *   lg  → 20 px  (w-5 h-5)      — nav items, section headers
 *   xl  → 24 px  (w-6 h-6)      — hero / feature call-outs
 *
 * Usage:
 *   import { Icon } from '../ui'
 *   import { CalendarCheck } from 'lucide-react'
 *   <Icon icon={CalendarCheck} size="lg" className="text-indigo-400" />
 */

import type { LucideIcon, LucideProps } from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

export interface IconProps extends Omit<LucideProps, 'size' | 'ref'> {
  /** The Lucide icon component to render */
  icon: LucideIcon
  /**
   * Canonical size token. Overrides any className width/height.
   * @default 'md'
   */
  size?: IconSize
}

// ── Size map ─────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'w-3.5 h-3.5', // 14 px
  md: 'w-4 h-4', //    16 px
  lg: 'w-5 h-5', //    20 px
  xl: 'w-6 h-6', //    24 px
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a Lucide icon at a standardised size.
 * Always sets `aria-hidden="true"` — wrap in a button/link with a visible
 * label or provide a sibling `<span className="sr-only">` for screen readers.
 */
export function Icon({ icon: LucideIcon, size = 'md', className, ...props }: IconProps) {
  return <LucideIcon className={cn(SIZE_CLASSES[size], className)} aria-hidden="true" {...props} />
}

// ── Convenience pixel constants (for non-Tailwind usage) ─────────────────────

export const ICON_PX: Record<IconSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
}
