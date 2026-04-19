/**
 * slotUtils — Pure utilities for appointment slot status and duration.
 *
 * Extracted from inline render logic in TodayAgenda / WeekView so that
 * status determination is testable and consistent across all schedule views.
 */

import { isAfter, isBefore, addMinutes } from 'date-fns'

/**
 * The four possible states a slot can be in relative to the current time.
 *
 * - `upcoming` — slot has not yet started
 * - `current`  — slot is in progress (started within the last 15 min)
 * - `late`     — slot started >15 min ago but has not ended (patient is overdue)
 * - `past`     — slot has ended
 */
export type SlotStatus = 'upcoming' | 'current' | 'late' | 'past'

/**
 * Returns the status of an appointment slot relative to `now`.
 *
 * @param startTime — parsed start Date of the slot
 * @param endTime   — parsed end Date of the slot
 * @param now       — reference time (defaults to `new Date()` for easy testing)
 */
export function getSlotStatus(startTime: Date, endTime: Date, now: Date = new Date()): SlotStatus {
  if (isAfter(now, endTime)) return 'past'
  if (isBefore(now, startTime)) return 'upcoming'
  // now is in the [startTime, endTime] window
  if (isAfter(now, addMinutes(startTime, 15))) return 'late'
  return 'current'
}

/**
 * Returns the duration of a slot in whole minutes.
 * Returns 0 if end is before start (defensive).
 */
export function getSlotDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60_000))
}

/**
 * Formats a duration in minutes into a human-readable string.
 *
 * @example
 * formatSlotDuration(30)  // "30m"
 * formatSlotDuration(60)  // "1h"
 * formatSlotDuration(90)  // "1h 30m"
 */
export function formatSlotDuration(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
