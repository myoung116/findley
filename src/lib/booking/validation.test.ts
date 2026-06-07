import { describe, it, expect } from 'vitest'
import { validateBookingDates, validateOffseasonGap, datesOverlap } from './validation'


describe('validateBookingDates — exclusive_offseason', () => {
  it('accepts a valid Mon–Mon 7-night off-season block', () => {
    // Oct 6 (Mon) to Oct 13 (Mon) 2025
    const result = validateBookingDates(
      new Date(2025, 9, 6),
      new Date(2025, 9, 13),
      'exclusive_offseason'
    )
    expect(result.valid).toBe(true)
  })

  it('rejects if not exactly 7 nights', () => {
    const result = validateBookingDates(
      new Date(2025, 9, 6),
      new Date(2025, 9, 14), // 8 nights
      'exclusive_offseason'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/7 nights/)
  })

  it('rejects if start is not Monday', () => {
    const result = validateBookingDates(
      new Date(2025, 9, 7), // Tuesday
      new Date(2025, 9, 14),
      'exclusive_offseason'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Monday/)
  })

  it('rejects if dates are in peak season', () => {
    const result = validateBookingDates(
      new Date(2025, 6, 7),  // July (peak)
      new Date(2025, 6, 14),
      'exclusive_offseason'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/off-season/)
  })
})

describe('validateBookingDates — exclusive_peak', () => {
  it('accepts a valid Mon–Fri 4-night peak block', () => {
    // June 2 (Mon) to June 6 (Fri) 2025
    const result = validateBookingDates(
      new Date(2025, 5, 2),
      new Date(2025, 5, 6),
      'exclusive_peak'
    )
    expect(result.valid).toBe(true)
  })

  it('rejects if end is not Friday', () => {
    const result = validateBookingDates(
      new Date(2025, 5, 2), // Monday
      new Date(2025, 5, 7), // Saturday
      'exclusive_peak'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Friday/)
  })

  it('rejects if in off-season', () => {
    const result = validateBookingDates(
      new Date(2025, 9, 6),
      new Date(2025, 9, 10),
      'exclusive_peak'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/peak season/)
  })
})

describe('validateBookingDates — lastminute_guest', () => {
  it('accepts a 2-day peak season window', () => {
    const result = validateBookingDates(
      new Date(2025, 6, 10),
      new Date(2025, 6, 12),
      'lastminute_guest'
    )
    expect(result.valid).toBe(true)
  })

  it('rejects if more than 2 days', () => {
    const result = validateBookingDates(
      new Date(2025, 6, 10),
      new Date(2025, 6, 14),
      'lastminute_guest'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/2-day/)
  })

  it('rejects if off-season', () => {
    const result = validateBookingDates(
      new Date(2025, 9, 10),
      new Date(2025, 9, 12),
      'lastminute_guest'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/peak season/)
  })
})

describe('validateBookingDates — open_shared', () => {
  it('accepts any valid date range', () => {
    expect(validateBookingDates(
      new Date(2025, 6, 1),
      new Date(2025, 6, 5),
      'open_shared'
    ).valid).toBe(true)
  })

  it('rejects end before start', () => {
    expect(validateBookingDates(
      new Date(2025, 6, 5),
      new Date(2025, 6, 1),
      'open_shared'
    ).valid).toBe(false)
  })
})

describe('validateOffseasonGap', () => {
  it('accepts blocks with exactly 7-day gap', () => {
    // Block A: Oct 6–13, Block B: Oct 20–27
    const result = validateOffseasonGap(
      new Date(2025, 9, 6), new Date(2025, 9, 13),
      new Date(2025, 9, 20), new Date(2025, 9, 27)
    )
    expect(result.valid).toBe(true)
  })

  it('rejects consecutive blocks (no gap)', () => {
    // Block A: Oct 6–13, Block B: Oct 13–20 (same day = 0 gap)
    const result = validateOffseasonGap(
      new Date(2025, 9, 6), new Date(2025, 9, 13),
      new Date(2025, 9, 13), new Date(2025, 9, 20)
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/gap/)
  })

  it('rejects blocks with only 6-day gap', () => {
    const result = validateOffseasonGap(
      new Date(2025, 9, 6), new Date(2025, 9, 13),
      new Date(2025, 9, 19), new Date(2025, 9, 26)
    )
    expect(result.valid).toBe(false)
  })

  it('works regardless of which block is submitted first', () => {
    const result = validateOffseasonGap(
      new Date(2025, 9, 20), new Date(2025, 9, 27), // B first
      new Date(2025, 9, 6),  new Date(2025, 9, 13)  // A second
    )
    expect(result.valid).toBe(true)
  })
})

describe('datesOverlap', () => {
  it('detects overlap', () => {
    expect(datesOverlap(
      new Date(2025, 6, 1), new Date(2025, 6, 10),
      new Date(2025, 6, 8), new Date(2025, 6, 15)
    )).toBe(true)
  })

  it('returns false for non-overlapping ranges', () => {
    expect(datesOverlap(
      new Date(2025, 6, 1), new Date(2025, 6, 7),
      new Date(2025, 6, 8), new Date(2025, 6, 15)
    )).toBe(false)
  })

  it('detects adjacent ranges as overlapping (inclusive)', () => {
    expect(datesOverlap(
      new Date(2025, 6, 1), new Date(2025, 6, 7),
      new Date(2025, 6, 7), new Date(2025, 6, 14)
    )).toBe(true)
  })
})
