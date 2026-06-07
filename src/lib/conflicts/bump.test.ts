import { describe, it, expect } from 'vitest'
import { decideBump, roomsConflict } from './bump'
import type { BumpCandidate } from './bump'

function makeCandidate(overrides: Partial<BumpCandidate> = {}): BumpCandidate {
  return {
    bookingId: 'booking-a',
    userId: 'user-a',
    userName: 'Alice',
    waiverInput: { bedroomNightsUsedTtm: 0, requestsMadeTtm: 0 },
    submittedAt: new Date('2025-07-01T10:00:00'),
    roomsRequested: ['room-1'],
    startDate: '2025-07-10',
    endDate: '2025-07-14',
    ...overrides,
  }
}

describe('decideBump', () => {
  it('bumps the higher-score candidate (waiver_score reason)', () => {
    const incoming = makeCandidate({ bookingId: 'new', userId: 'u1', userName: 'Alice', waiverInput: { bedroomNightsUsedTtm: 5, requestsMadeTtm: 0 } })
    const existing = makeCandidate({ bookingId: 'old', userId: 'u2', userName: 'Bob',   waiverInput: { bedroomNightsUsedTtm: 20, requestsMadeTtm: 2 } })

    const decision = decideBump(incoming, existing)
    expect(decision.loserBookingId).toBe('old')
    expect(decision.winnerBookingId).toBe('new')
    expect(decision.reason).toBe('waiver_score')
  })

  it('bumps incoming when existing has lower score', () => {
    const incoming = makeCandidate({ bookingId: 'new', userId: 'u1', waiverInput: { bedroomNightsUsedTtm: 30, requestsMadeTtm: 4 } })
    const existing = makeCandidate({ bookingId: 'old', userId: 'u2', waiverInput: { bedroomNightsUsedTtm: 2,  requestsMadeTtm: 0 } })

    const decision = decideBump(incoming, existing)
    expect(decision.loserBookingId).toBe('new')
    expect(decision.winnerBookingId).toBe('old')
    expect(decision.reason).toBe('waiver_score')
  })

  it('breaks tie by earliest submission timestamp', () => {
    const early  = makeCandidate({ bookingId: 'early',  submittedAt: new Date('2025-07-01T08:00:00'), waiverInput: { bedroomNightsUsedTtm: 10, requestsMadeTtm: 0 } })
    const late   = makeCandidate({ bookingId: 'late',   submittedAt: new Date('2025-07-01T12:00:00'), waiverInput: { bedroomNightsUsedTtm: 10, requestsMadeTtm: 0 } })

    const decision = decideBump(late, early) // incoming=late, existing=early
    expect(decision.winnerBookingId).toBe('early')
    expect(decision.loserBookingId).toBe('late')
    expect(decision.reason).toBe('timestamp')
  })

  it('returns loserUserName for the losing candidate', () => {
    const incoming = makeCandidate({ bookingId: 'new', userName: 'Alice', waiverInput: { bedroomNightsUsedTtm: 0, requestsMadeTtm: 0 } })
    const existing = makeCandidate({ bookingId: 'old', userName: 'Bob',   waiverInput: { bedroomNightsUsedTtm: 50, requestsMadeTtm: 0 } })

    const decision = decideBump(incoming, existing)
    expect(decision.loserUserName).toBe('Bob')
  })
})

describe('roomsConflict', () => {
  it('returns true when rooms overlap', () => {
    expect(roomsConflict(['r1', 'r2'], ['r2', 'r3'])).toBe(true)
  })

  it('returns false when no overlap', () => {
    expect(roomsConflict(['r1', 'r2'], ['r3', 'r4'])).toBe(false)
  })

  it('returns false for empty arrays', () => {
    expect(roomsConflict([], ['r1'])).toBe(false)
    expect(roomsConflict(['r1'], [])).toBe(false)
  })

  it('returns true for identical single room', () => {
    expect(roomsConflict(['r1'], ['r1'])).toBe(true)
  })
})
