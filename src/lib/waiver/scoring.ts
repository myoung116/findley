export interface WaiverInput {
  bedroomNightsUsedTtm: number
  requestsMadeTtm: number
}

/**
 * Calculates a principal's waiver score.
 * Lower score = higher priority.
 * Formula: (bedroom_nights_used_ttm × 1.0) + (requests_made_ttm × 0.5)
 */
export function calculateWaiverScore(input: WaiverInput): number {
  return input.bedroomNightsUsedTtm * 1.0 + input.requestsMadeTtm * 0.5
}

/**
 * Sorts principals by waiver priority (lowest score first).
 * Ties broken by submission timestamp (earlier = higher priority).
 */
export function sortByWaiverPriority<T extends { score: number; submittedAt: Date }>(
  principals: T[]
): T[] {
  return [...principals].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    return a.submittedAt.getTime() - b.submittedAt.getTime()
  })
}

/**
 * Calculates bedroom-nights for a booking.
 * Full block counts even if principal leaves early.
 */
export function calculateBedroomNights(roomCount: number, nights: number): number {
  return roomCount * nights
}

/**
 * Returns true if a booking falls within the trailing 12-month window from a reference date.
 */
export function isWithinTtm(bookingDate: Date, referenceDate: Date): boolean {
  const ttmStart = new Date(referenceDate)
  ttmStart.setFullYear(ttmStart.getFullYear() - 1)
  return bookingDate >= ttmStart && bookingDate <= referenceDate
}
