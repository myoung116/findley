import type { BookingType } from '@/lib/supabase/types'
import { isPeakSeason, isEntirelyOffSeason, isEntirelyPeakSeason } from './seasons'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Returns the day-of-week index for a date (0 = Sunday, 1 = Monday, etc.)
 */
function dayOfWeek(date: Date): number {
  return date.getDay()
}

const MONDAY = 1
const FRIDAY = 5

/**
 * Validates that a booking's dates are legal for its booking type.
 */
export function validateBookingDates(
  startDate: Date,
  endDate: Date,
  bookingType: BookingType
): ValidationResult {
  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date.' }
  }

  switch (bookingType) {
    case 'exclusive_offseason': {
      if (!isEntirelyOffSeason(startDate, endDate)) {
        return { valid: false, error: 'Off-season exclusive blocks must fall entirely in off-season.' }
      }
      if (dayOfWeek(startDate) !== MONDAY) {
        return { valid: false, error: 'Off-season exclusive blocks must start on a Monday.' }
      }
      if (dayOfWeek(endDate) !== MONDAY) {
        return { valid: false, error: 'Off-season exclusive blocks must end on a Monday (7 nights).' }
      }
      const nights = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (nights !== 7) {
        return { valid: false, error: 'Off-season exclusive blocks must be exactly 7 nights (Mon–Mon).' }
      }
      return { valid: true }
    }

    case 'exclusive_peak': {
      if (!isEntirelyPeakSeason(startDate, endDate)) {
        return { valid: false, error: 'Peak exclusive blocks must fall entirely in peak season.' }
      }
      if (dayOfWeek(startDate) !== MONDAY) {
        return { valid: false, error: 'Peak exclusive blocks must start on a Monday.' }
      }
      if (dayOfWeek(endDate) !== FRIDAY) {
        return { valid: false, error: 'Peak exclusive blocks must end on a Friday (Mon–Fri).' }
      }
      const nights = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (nights !== 4) {
        return { valid: false, error: 'Peak exclusive blocks must be exactly 4 nights (Mon–Fri).' }
      }
      return { valid: true }
    }

    case 'lastminute_guest': {
      if (!isPeakSeason(startDate)) {
        return { valid: false, error: 'Last-minute guest bookings are only allowed during peak season.' }
      }
      const nights = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (nights > 2) {
        return { valid: false, error: 'Last-minute guest bookings are limited to a 2-day window.' }
      }
      return { valid: true }
    }

    case 'open_shared':
      return { valid: true }
  }
}

/**
 * Validates that two off-season exclusive blocks for the same principal
 * have at least one full open week gap between them.
 */
export function validateOffseasonGap(
  blockAStart: Date,
  blockAEnd: Date,
  blockBStart: Date,
  blockBEnd: Date
): ValidationResult {
  // Ensure A comes before B
  const [firstEnd, secondStart] =
    blockAStart < blockBStart
      ? [blockAEnd, blockBStart]
      : [blockBEnd, blockAStart]

  const gapDays = (secondStart.getTime() - firstEnd.getTime()) / (1000 * 60 * 60 * 24)

  if (gapDays < 7) {
    return {
      valid: false,
      error: 'Off-season exclusive blocks must have at least one full open week gap between them.',
    }
  }
  return { valid: true }
}

/**
 * Returns true if two date ranges overlap (inclusive).
 */
export function datesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}
