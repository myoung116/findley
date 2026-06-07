import { describe, it, expect } from 'vitest'
import { calculateScoresForPrincipals, countNights, type BookingRecord } from './calculate'

const REF = new Date('2025-07-01')

function makeBooking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: 'b1',
    userId: 'u1',
    bookingType: 'open_shared',
    startDate: '2025-06-01',
    endDate: '2025-06-05',
    roomsRequested: ['r1'],
    status: 'confirmed',
    ...overrides,
  }
}

describe('countNights', () => {
  it('counts nights correctly', () => {
    expect(countNights('2025-06-01', '2025-06-05')).toBe(4)
  })

  it('returns 0 for same-day', () => {
    expect(countNights('2025-06-01', '2025-06-01')).toBe(0)
  })

  it('counts a 7-night week', () => {
    expect(countNights('2025-10-06', '2025-10-13')).toBe(7)
  })
})

describe('calculateScoresForPrincipals', () => {
  it('returns zero score when no bookings', () => {
    const scores = calculateScoresForPrincipals(['u1'], [], REF)
    expect(scores[0]).toMatchObject({ userId: 'u1', score: 0, nightsTtm: 0, requestsTtm: 0 })
  })

  it('calculates bedroom-nights correctly (rooms × nights)', () => {
    const bookings = [
      makeBooking({ roomsRequested: ['r1', 'r2'], startDate: '2025-06-01', endDate: '2025-06-05' }), // 2 rooms × 4 nights = 8
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].nightsTtm).toBe(8)
    expect(scores[0].requestsTtm).toBe(1)
    // score = 8 * 1.0 + 1 * 0.5 = 8.5
    expect(scores[0].score).toBe(8.5)
  })

  it('excludes exclusive blocks from score', () => {
    const bookings = [
      makeBooking({ bookingType: 'exclusive_offseason' }),
      makeBooking({ bookingType: 'exclusive_peak' }),
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].score).toBe(0)
    expect(scores[0].nightsTtm).toBe(0)
  })

  it('includes lastminute_guest bookings', () => {
    const bookings = [
      makeBooking({ bookingType: 'lastminute_guest', startDate: '2025-06-10', endDate: '2025-06-12' }), // 1 room × 2 nights = 2
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].nightsTtm).toBe(2)
    expect(scores[0].requestsTtm).toBe(1)
  })

  it('excludes bookings outside the TTM window', () => {
    const bookings = [
      makeBooking({ startDate: '2024-06-30', endDate: '2024-07-04' }), // just outside 12-month window
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].score).toBe(0)
  })

  it('includes bookings on the TTM boundary', () => {
    const bookings = [
      makeBooking({ startDate: '2024-07-01', endDate: '2024-07-05' }), // exactly 12 months ago
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].nightsTtm).toBe(4) // 1 room × 4 nights
  })

  it('excludes non-confirmed bookings', () => {
    const bookings = [
      makeBooking({ status: 'pending' }),
      makeBooking({ status: 'bumped' }),
      makeBooking({ status: 'cancelled' }),
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].score).toBe(0)
  })

  it('only counts bookings belonging to the correct principal', () => {
    const bookings = [
      makeBooking({ userId: 'u1' }),
      makeBooking({ id: 'b2', userId: 'u2' }),
    ]
    const scores = calculateScoresForPrincipals(['u1', 'u2'], bookings, REF)
    expect(scores.find(s => s.userId === 'u1')?.requestsTtm).toBe(1)
    expect(scores.find(s => s.userId === 'u2')?.requestsTtm).toBe(1)
  })

  it('sums multiple bookings for the same principal', () => {
    const bookings = [
      makeBooking({ id: 'b1', startDate: '2025-05-01', endDate: '2025-05-04' }), // 1r × 3n = 3
      makeBooking({ id: 'b2', startDate: '2025-06-01', endDate: '2025-06-06', roomsRequested: ['r1', 'r2'] }), // 2r × 5n = 10
    ]
    const scores = calculateScoresForPrincipals(['u1'], bookings, REF)
    expect(scores[0].nightsTtm).toBe(13)
    expect(scores[0].requestsTtm).toBe(2)
    // 13 * 1.0 + 2 * 0.5 = 14
    expect(scores[0].score).toBe(14)
  })
})
