import { calculateWaiverScore, isWithinTtm, calculateBedroomNights } from './scoring'

export interface BookingRecord {
  id: string
  userId: string
  bookingType: 'exclusive_offseason' | 'exclusive_peak' | 'open_shared' | 'lastminute_guest'
  startDate: string
  endDate: string
  roomsRequested: string[]
  status: 'confirmed' | 'bumped' | 'cancelled' | 'pending' | 'draft'
}

export interface PrincipalScore {
  userId: string
  score: number
  nightsTtm: number
  requestsTtm: number
}

const WAIVER_ELIGIBLE_TYPES = new Set(['open_shared', 'lastminute_guest'])

/**
 * Calculates the number of nights between two date strings.
 */
export function countNights(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Calculates waiver scores for all principals given their booking history.
 * Only confirmed bookings count. Exclusive blocks are excluded.
 * Full block counts regardless of early departure.
 */
export function calculateScoresForPrincipals(
  principalIds: string[],
  bookings: BookingRecord[],
  referenceDate: Date
): PrincipalScore[] {
  return principalIds.map(userId => {
    const myBookings = bookings.filter(
      b =>
        b.userId === userId &&
        b.status === 'confirmed' &&
        WAIVER_ELIGIBLE_TYPES.has(b.bookingType) &&
        isWithinTtm(new Date(b.startDate), referenceDate)
    )

    const nightsTtm = myBookings.reduce((sum, b) => {
      const nights = countNights(b.startDate, b.endDate)
      const rooms = b.roomsRequested.length
      return sum + calculateBedroomNights(rooms, nights)
    }, 0)

    const requestsTtm = myBookings.length

    const score = calculateWaiverScore({
      bedroomNightsUsedTtm: nightsTtm,
      requestsMadeTtm: requestsTtm,
    })

    return { userId, score, nightsTtm, requestsTtm }
  })
}
