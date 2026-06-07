import { describe, it, expect } from 'vitest'
import { getMemorialDay, getLaborDay, isPeakSeason, getSeasonForDate } from './seasons'

describe('getMemorialDay', () => {
  it('returns last Monday of May 2025 (May 26)', () => {
    const d = getMemorialDay(2025)
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(4) // May
    expect(d.getDate()).toBe(26)
    expect(d.getDay()).toBe(1) // Monday
  })

  it('returns last Monday of May 2026 (May 25)', () => {
    const d = getMemorialDay(2026)
    expect(d.getDate()).toBe(25)
    expect(d.getDay()).toBe(1)
  })
})

describe('getLaborDay', () => {
  it('returns first Monday of September 2025 (Sep 1)', () => {
    const d = getLaborDay(2025)
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(8) // September
    expect(d.getDate()).toBe(1)
    expect(d.getDay()).toBe(1)
  })

  it('returns first Monday of September 2026 (Sep 7)', () => {
    const d = getLaborDay(2026)
    expect(d.getDate()).toBe(7)
    expect(d.getDay()).toBe(1)
  })
})

describe('isPeakSeason', () => {
  it('Memorial Day itself is peak season', () => {
    expect(isPeakSeason(new Date(2025, 4, 26))).toBe(true)
  })

  it('Labor Day itself is peak season', () => {
    expect(isPeakSeason(new Date(2025, 8, 1))).toBe(true)
  })

  it('day after Labor Day is off-season', () => {
    expect(isPeakSeason(new Date(2025, 8, 2))).toBe(false)
  })

  it('day before Memorial Day is off-season', () => {
    expect(isPeakSeason(new Date(2025, 4, 25))).toBe(false)
  })

  it('mid-July is peak season', () => {
    expect(isPeakSeason(new Date(2025, 6, 15))).toBe(true)
  })

  it('January is off-season', () => {
    expect(isPeakSeason(new Date(2025, 0, 15))).toBe(false)
  })

  it('October is off-season', () => {
    expect(isPeakSeason(new Date(2025, 9, 1))).toBe(false)
  })
})

describe('getSeasonForDate', () => {
  it('returns peak for summer date', () => {
    expect(getSeasonForDate(new Date(2025, 7, 1))).toBe('peak')
  })

  it('returns offseason for winter date', () => {
    expect(getSeasonForDate(new Date(2025, 11, 1))).toBe('offseason')
  })
})
