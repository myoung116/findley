import { describe, it, expect } from 'vitest'
import {
  deriveEndDate,
  isValidStartDate,
  getMinStartDate,
  BOOKING_TYPE_LABELS,
  BOOKING_TYPE_DESCRIPTIONS,
} from './dates'

describe('deriveEndDate', () => {
  it('returns Mon+7 for exclusive_offseason', () => {
    // Oct 6 (Mon) + 7 = Oct 13 (Mon)
    expect(deriveEndDate('exclusive_offseason', '2025-10-06')).toBe('2025-10-13')
  })

  it('returns Mon+4 for exclusive_peak', () => {
    // Jun 2 (Mon) + 4 = Jun 6 (Fri)
    expect(deriveEndDate('exclusive_peak', '2025-06-02')).toBe('2025-06-06')
  })

  it('returns null for open_shared (user picks end date)', () => {
    expect(deriveEndDate('open_shared', '2025-07-01')).toBeNull()
  })

  it('returns null for lastminute_guest', () => {
    expect(deriveEndDate('lastminute_guest', '2025-07-01')).toBeNull()
  })

  it('returns null when startDate is empty', () => {
    expect(deriveEndDate('exclusive_offseason', '')).toBeNull()
  })
})

describe('isValidStartDate', () => {
  // Oct 6 2025 = Monday, Oct 7 = Tuesday
  it('accepts Monday for exclusive_offseason', () => {
    expect(isValidStartDate('exclusive_offseason', '2025-10-06')).toBe(true)
  })

  it('rejects Tuesday for exclusive_offseason', () => {
    expect(isValidStartDate('exclusive_offseason', '2025-10-07')).toBe(false)
  })

  it('accepts Monday for exclusive_peak', () => {
    expect(isValidStartDate('exclusive_peak', '2025-06-02')).toBe(true)
  })

  it('rejects Friday for exclusive_peak', () => {
    expect(isValidStartDate('exclusive_peak', '2025-06-06')).toBe(false)
  })

  it('accepts any day for open_shared', () => {
    expect(isValidStartDate('open_shared', '2025-07-05')).toBe(true) // Saturday
    expect(isValidStartDate('open_shared', '2025-07-06')).toBe(true) // Sunday
  })

  it('accepts any day for lastminute_guest', () => {
    expect(isValidStartDate('lastminute_guest', '2025-07-05')).toBe(true)
  })
})

describe('getMinStartDate', () => {
  it('returns a date string in yyyy-MM-dd format', () => {
    expect(getMinStartDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns today\'s date', () => {
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(getMinStartDate()).toBe(expected)
  })
})

describe('BOOKING_TYPE_LABELS', () => {
  it('has a label for every booking type', () => {
    const types = ['exclusive_offseason', 'exclusive_peak', 'open_shared', 'lastminute_guest'] as const
    for (const type of types) {
      expect(BOOKING_TYPE_LABELS[type]).toBeTruthy()
    }
  })
})

describe('BOOKING_TYPE_DESCRIPTIONS', () => {
  it('has a description for every booking type', () => {
    const types = ['exclusive_offseason', 'exclusive_peak', 'open_shared', 'lastminute_guest'] as const
    for (const type of types) {
      expect(BOOKING_TYPE_DESCRIPTIONS[type]).toBeTruthy()
    }
  })
})
