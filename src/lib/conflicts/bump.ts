import { calculateWaiverScore, type WaiverInput } from '@/lib/waiver/scoring'

export interface BumpCandidate {
  bookingId: string
  userId: string
  userName: string
  waiverInput: WaiverInput
  submittedAt: Date
  roomsRequested: string[]
  startDate: string
  endDate: string
}

export interface BumpDecision {
  winnerBookingId: string
  loserBookingId: string
  loserUserId: string
  loserUserName: string
  reason: 'waiver_score' | 'timestamp' | 'papa_override'
}

/**
 * Determines which booking should be bumped when two open_shared bookings
 * conflict on room availability. Returns null if no bump needed (no overlap).
 */
export function decideBump(
  incoming: BumpCandidate,
  existing: BumpCandidate
): BumpDecision {
  const incomingScore = calculateWaiverScore(incoming.waiverInput)
  const existingScore = calculateWaiverScore(existing.waiverInput)

  if (incomingScore < existingScore) {
    return {
      winnerBookingId: incoming.bookingId,
      loserBookingId: existing.bookingId,
      loserUserId: existing.userId,
      loserUserName: existing.userName,
      reason: 'waiver_score',
    }
  }

  if (existingScore < incomingScore) {
    return {
      winnerBookingId: existing.bookingId,
      loserBookingId: incoming.bookingId,
      loserUserId: incoming.userId,
      loserUserName: incoming.userName,
      reason: 'waiver_score',
    }
  }

  // Tie — earlier submission wins
  if (incoming.submittedAt < existing.submittedAt) {
    return {
      winnerBookingId: incoming.bookingId,
      loserBookingId: existing.bookingId,
      loserUserId: existing.userId,
      loserUserName: existing.userName,
      reason: 'timestamp',
    }
  }

  return {
    winnerBookingId: existing.bookingId,
    loserBookingId: incoming.bookingId,
    loserUserId: incoming.userId,
    loserUserName: incoming.userName,
    reason: 'timestamp',
  }
}

/**
 * Returns true if the two room arrays have any overlap.
 */
export function roomsConflict(roomsA: string[], roomsB: string[]): boolean {
  const setA = new Set(roomsA)
  return roomsB.some(r => setA.has(r))
}
