/**
 * MetricCard — KPI tile for dashboard stat strips.
 *
 * Built on top of the shared Card primitive so it automatically inherits
 * theming, dark-mode handling, and variant behaviour. Pass a Lucide icon
 * component, a colour accent, and the three text fields.
 *
 * @example
 * <MetricCard
 *   icon={CalendarCheck}
 *   label="Active Visits"
 *   value="12"
 *   sub="This week"
 *   color="indigo"
 * />
 */

import React from 'react'
import { cn } from '../../lib/utils'
import { Card, CardContent } from './Card'

// ── Types ────────────────────────────────────────────────────────────────────

export type MetricCardColor = 'indigo' | 'emerald' | 'amber' | 'slate' | 'rose'

export interface MetricCardProps {
  /** Lucide icon component to display */
  icon: React.ElementType
  /** Short uppercase label above the value */
  label: string
  /** Primary metric value */
  value: string
  /** Supplementary sub-label below the value */
  sub: string
  /** Accent colour for the icon container */
  color: MetricCardColor
}

// ── Accent colour map ────────────────────────────────────────────────────────

const ICON_COLORS: Record<MetricCardColor, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  slate: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MetricCard = ({ icon: Icon, label, value, sub, color }: MetricCardProps) => (
  <Card className="hover:shadow-card-md transition-all duration-200 hover:scale-[1.02] group">
    <CardContent className="p-3 md:p-5">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Accent icon container */}
        <div
          className={cn(
            'p-2 md:p-3 rounded-xl transition-transform duration-200 group-hover:scale-110 shrink-0',
            ICON_COLORS[color],
          )}
        >
          {/* w-5/w-6 matches Icon size lg/xl in the convention */}
          <Icon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
        </div>

        {/* Text stack */}
        <div className="min-w-0">
          <p className="text-2xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1 truncate">
            {label}
          </p>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5 md:mb-1">
            {value}
          </h3>
          <p className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight truncate">
            {sub}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)
