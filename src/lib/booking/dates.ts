import { format, addDays, isMonday, parseISO } from 'date-fns'
import type { BookingType } from '@/lib/supabase/types'

/**
 * Given a booking type and a start date string, returns the required end date.
 * Returns null for types where end date is user-defined.
 */
export function deriveEndDate(bookingType: BookingType, startDate: string): string | null {
  if (!startDate) return null
  const start = parseISO(startDate)

  switch (bookingType) {
    case 'exclusive_offseason':
      return format(addDays(start, 7), 'yyyy-MM-dd')
    case 'exclusive_peak':
      return format(addDays(start, 4), 'yyyy-MM-dd')
    default:
      return null
  }
}

/**
 * Returns whether a date string is a valid start date for the given booking type.
 */
export function isValidStartDate(bookingType: BookingType, dateStr: string): boolean {
  const date = parseISO(dateStr)
  switch (bookingType) {
    case 'exclusive_offseason':
    case 'exclusive_peak':
      return isMonday(date)
    default:
      return true
  }
}

/**
 * Returns the min selectable start date for a booking type (today).
 */
export function getMinStartDate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  exclusive_offseason: 'Off-Season Exclusive (Mon–Mon, 7 nights)',
  exclusive_peak: 'Peak Season Exclusive (Mon–Fri, 4 nights)',
  open_shared: 'Open / Shared Visit',
  lastminute_guest: 'Last-Minute Guest (2-day window, peak only)',
}

export const BOOKING_TYPE_DESCRIPTIONS: Record<BookingType, string> = {
  exclusive_offseason: 'Private use of the house for a full week. No other families during your block.',
  exclusive_peak: 'Exclusive Mon–Fri during peak season. Weekend reverts to open access.',
  open_shared: 'Non-exclusive visit — other families may overlap.',
  lastminute_guest: 'Auto-confirmed 2-day guest window when no other bookings exist for those dates.',
}
