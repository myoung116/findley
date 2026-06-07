import { describe, it, expect } from 'vitest'
import { getCyclePhase } from './cycle'

// 2025 dates:
// Memorial Day:          May 26
// Labor Day:             Sep 1
// 3 weeks before LD:     Aug 11
// 1 week before LD:      Aug 25

// 2026 dates:
// Memorial Day:          May 25
// Labor Day:             Sep 7
// 3 weeks before LD:     Aug 17
// 1 week before LD:      Aug 31

describe('getCyclePhase', () => {
  it('returns memorial_day_open on Memorial Day 2025 (May 26)', () => {
    expect(getCyclePhase(new Date(2025, 4, 26))).toBe('memorial_day_open')
  })

  it('returns memorial_day_open on Memorial Day 2026 (May 25)', () => {
    expect(getCyclePhase(new Date(2026, 4, 25))).toBe('memorial_day_open')
  })

  it('returns labor_day_lockin on Labor Day 2025 (Sep 1)', () => {
    expect(getCyclePhase(new Date(2025, 8, 1))).toBe('labor_day_lockin')
  })

  it('returns labor_day_lockin on Labor Day 2026 (Sep 7)', () => {
    expect(getCyclePhase(new Date(2026, 8, 7))).toBe('labor_day_lockin')
  })

  it('returns conflict_deadline_3wk 21 days before Labor Day 2025 (Aug 11)', () => {
    expect(getCyclePhase(new Date(2025, 7, 11))).toBe('conflict_deadline_3wk')
  })

  it('returns conflict_deadline_1wk 7 days before Labor Day 2025 (Aug 25)', () => {
    expect(getCyclePhase(new Date(2025, 7, 25))).toBe('conflict_deadline_1wk')
  })

  it('returns conflict_deadline_3wk 21 days before Labor Day 2026 (Aug 17)', () => {
    expect(getCyclePhase(new Date(2026, 7, 17))).toBe('conflict_deadline_3wk')
  })

  it('returns conflict_deadline_1wk 7 days before Labor Day 2026 (Aug 31)', () => {
    expect(getCyclePhase(new Date(2026, 7, 31))).toBe('conflict_deadline_1wk')
  })

  it('returns null for a regular summer day', () => {
    expect(getCyclePhase(new Date(2025, 6, 15))).toBeNull()
  })

  it('returns null for a day adjacent to Memorial Day', () => {
    expect(getCyclePhase(new Date(2025, 4, 25))).toBeNull() // day before
    expect(getCyclePhase(new Date(2025, 4, 27))).toBeNull() // day after
  })

  it('returns null for a day adjacent to Labor Day', () => {
    expect(getCyclePhase(new Date(2025, 7, 31))).toBeNull() // day before
    expect(getCyclePhase(new Date(2025, 8, 2))).toBeNull()  // day after
  })

  it('returns null for a winter date', () => {
    expect(getCyclePhase(new Date(2025, 11, 25))).toBeNull()
  })
})
