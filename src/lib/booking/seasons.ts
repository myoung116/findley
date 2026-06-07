import type { SeasonType } from '@/lib/supabase/types'

/**
 * Returns the date of Memorial Day (last Monday of May) for a given year.
 */
export function getMemorialDay(year: number): Date {
  // Last Monday of May: start from May 31 and walk back to Monday
  const date = new Date(year, 4, 31)
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() - 1)
  }
  return date
}

/**
 * Returns the date of Labor Day (first Monday of September) for a given year.
 */
export function getLaborDay(year: number): Date {
  const date = new Date(year, 8, 1)
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1)
  }
  return date
}

/**
 * Returns whether a given date falls in peak season.
 * Peak = Memorial Day through Labor Day, inclusive.
 */
export function isPeakSeason(date: Date): boolean {
  const year = date.getFullYear()
  const memorialDay = getMemorialDay(year)
  const laborDay = getLaborDay(year)
  return date >= memorialDay && date <= laborDay
}

export function getSeasonForDate(date: Date): SeasonType {
  return isPeakSeason(date) ? 'peak' : 'offseason'
}

/**
 * Returns the season for a booking given its start date.
 * Season is determined by where the start date falls.
 */
export function getSeasonForBooking(startDate: Date): SeasonType {
  return getSeasonForDate(startDate)
}

/**
 * Returns true if a date range falls entirely within peak season.
 */
export function isEntirelyPeakSeason(startDate: Date, endDate: Date): boolean {
  return isPeakSeason(startDate) && isPeakSeason(endDate)
}

/**
 * Returns true if a date range falls entirely within off-season.
 */
export function isEntirelyOffSeason(startDate: Date, endDate: Date): boolean {
  return !isPeakSeason(startDate) && !isPeakSeason(endDate)
}
