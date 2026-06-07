import { describe, it, expect } from 'vitest'
import {
  calculateWaiverScore,
  sortByWaiverPriority,
  calculateBedroomNights,
  isWithinTtm,
} from './scoring'

describe('calculateWaiverScore', () => {
  it('calculates correctly', () => {
    expect(calculateWaiverScore({ bedroomNightsUsedTtm: 10, requestsMadeTtm: 4 })).toBe(12)
  })

  it('returns 0 for no usage', () => {
    expect(calculateWaiverScore({ bedroomNightsUsedTtm: 0, requestsMadeTtm: 0 })).toBe(0)
  })

  it('weights bedroom nights at 1.0 and requests at 0.5', () => {
    expect(calculateWaiverScore({ bedroomNightsUsedTtm: 6, requestsMadeTtm: 2 })).toBe(7)
  })
})

describe('sortByWaiverPriority', () => {
  it('sorts lowest score first', () => {
    const principals = [
      { id: 'a', score: 20, submittedAt: new Date('2025-07-01') },
      { id: 'b', score: 5,  submittedAt: new Date('2025-07-01') },
      { id: 'c', score: 12, submittedAt: new Date('2025-07-01') },
    ]
    const sorted = sortByWaiverPriority(principals)
    expect(sorted.map(p => p.id)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties by earliest submission timestamp', () => {
    const principals = [
      { id: 'a', score: 10, submittedAt: new Date('2025-07-02T10:00:00') },
      { id: 'b', score: 10, submittedAt: new Date('2025-07-02T08:00:00') },
    ]
    const sorted = sortByWaiverPriority(principals)
    expect(sorted[0].id).toBe('b') // earlier timestamp wins
  })

  it('does not mutate the original array', () => {
    const principals = [
      { id: 'a', score: 20, submittedAt: new Date() },
      { id: 'b', score: 5,  submittedAt: new Date() },
    ]
    const original = [...principals]
    sortByWaiverPriority(principals)
    expect(principals[0].id).toBe(original[0].id)
  })
})

describe('calculateBedroomNights', () => {
  it('multiplies rooms by nights', () => {
    expect(calculateBedroomNights(3, 4)).toBe(12)
  })

  it('handles 1 room 1 night', () => {
    expect(calculateBedroomNights(1, 1)).toBe(1)
  })
})

describe('isWithinTtm', () => {
  const ref = new Date('2025-07-01')

  it('includes a date exactly 12 months ago', () => {
    expect(isWithinTtm(new Date('2024-07-01'), ref)).toBe(true)
  })

  it('excludes a date more than 12 months ago', () => {
    expect(isWithinTtm(new Date('2024-06-30'), ref)).toBe(false)
  })

  it('includes today', () => {
    expect(isWithinTtm(ref, ref)).toBe(true)
  })

  it('excludes a future date', () => {
    expect(isWithinTtm(new Date('2025-08-01'), ref)).toBe(false)
  })
})
