import { getMemorialDay, getLaborDay } from './seasons'
import { addDays, isSameDay } from 'date-fns'

export type CyclePhase =
  | 'memorial_day_open'
  | 'conflict_deadline_3wk'
  | 'conflict_deadline_1wk'
  | 'labor_day_lockin'
  | null

/**
 * Returns which annual cycle phase applies to a given date, or null if none.
 * Only one phase can be active on any given day.
 */
export function getCyclePhase(date: Date): CyclePhase {
  const year = date.getFullYear()
  const memorialDay = getMemorialDay(year)
  const laborDay = getLaborDay(year)

  if (isSameDay(date, memorialDay)) return 'memorial_day_open'
  if (isSameDay(date, addDays(laborDay, -21))) return 'conflict_deadline_3wk'
  if (isSameDay(date, addDays(laborDay, -7))) return 'conflict_deadline_1wk'
  if (isSameDay(date, laborDay)) return 'labor_day_lockin'

  return null
}

/**
 * Returns the Labor Day for a given date's peak season year.
 * Used to determine which season's blocks to lock in.
 */
export function getLaborDayForDate(date: Date): Date {
  return getLaborDay(date.getFullYear())
}

/**
 * Returns the Memorial Day for a given date's off-season planning year.
 * Off-season runs from post-Labor Day through Memorial Day, so
 * Memorial Day 2026 closes the 2025–2026 off-season planning window.
 */
export function getMemorialDayForDate(date: Date): Date {
  return getMemorialDay(date.getFullYear())
}
