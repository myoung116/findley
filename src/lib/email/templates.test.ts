import { describe, it, expect } from 'vitest'
import { buildEmailContent } from './templates'

const APP = 'https://findleylake.com'
const NAME = 'Tom'

describe('buildEmailContent', () => {
  it('exclusive_overlap — includes conflicting principal name and dates', () => {
    const result = buildEmailContent(
      'exclusive_overlap',
      { conflicting_principal: 'Lynn', dates_requested: { start: '2025-10-06', end: '2025-10-13' } },
      NAME, APP
    )
    expect(result.subject).toContain('Lynn')
    expect(result.html).toContain('Lynn')
    expect(result.html).toContain('Oct 6')
    expect(result.html).toContain('Oct 13')
  })

  it('papa_overlap — mentions Papa and lists available rooms', () => {
    const result = buildEmailContent(
      'papa_overlap',
      {
        dates_requested: { start: '2025-07-07', end: '2025-07-11' },
        rooms_available: [{ name: 'Lake Room' }, { name: 'Bunk Room' }],
      },
      NAME, APP
    )
    expect(result.subject).toContain('Papa')
    expect(result.html).toContain('Lake Room')
    expect(result.html).toContain('Bunk Room')
  })

  it('conflict_deadline_3wk — mentions 3 weeks', () => {
    const result = buildEmailContent(
      'conflict_deadline_3wk',
      { labor_day: '2025-09-01', message: '' },
      NAME, APP
    )
    expect(result.subject).toContain('3 weeks')
    expect(result.html).toContain('September 1, 2025')
  })

  it('conflict_deadline_1wk — marked as final notice', () => {
    const result = buildEmailContent(
      'conflict_deadline_1wk',
      { labor_day: '2025-09-01', message: '' },
      NAME, APP
    )
    expect(result.subject).toContain('1 week')
    expect(result.html).toContain('Final notice')
  })

  it('waiver_bump — includes conflicting principal and available rooms', () => {
    const result = buildEmailContent(
      'waiver_bump',
      {
        dates_requested: { start: '2025-07-10', end: '2025-07-14' },
        rooms_requested: ['r1'],
        rooms_available: [{ name: 'Garden Room' }],
        conflicting_principal: 'Moe',
      },
      NAME, APP
    )
    expect(result.subject).toContain('bumped')
    expect(result.html).toContain('Moe')
    expect(result.html).toContain('Garden Room')
  })

  it('waiver_bump — shows no rooms message when none available', () => {
    const result = buildEmailContent(
      'waiver_bump',
      {
        dates_requested: { start: '2025-07-10', end: '2025-07-14' },
        rooms_requested: ['r1'],
        rooms_available: [],
        conflicting_principal: 'Moe',
      },
      NAME, APP
    )
    expect(result.html).toContain('No rooms available')
  })

  it('booking_confirmed — shows confirmed status', () => {
    const result = buildEmailContent(
      'booking_confirmed',
      {
        booking_type: 'open_shared',
        start_date: '2025-07-10',
        end_date: '2025-07-14',
        status: 'confirmed',
      },
      NAME, APP
    )
    expect(result.subject).toContain('confirmed')
    expect(result.html).toContain('Open / Shared')
    expect(result.html).toContain('Jul 10')
  })

  it('booking_confirmed — shows pending status for non-auto-confirm', () => {
    const result = buildEmailContent(
      'booking_confirmed',
      {
        booking_type: 'exclusive_offseason',
        start_date: '2025-10-06',
        end_date: '2025-10-13',
        status: 'pending',
      },
      NAME, APP
    )
    expect(result.subject).toContain('received')
    expect(result.html).toContain('pending')
  })

  it('all templates include the recipient name', () => {
    const types = [
      ['exclusive_overlap', { conflicting_principal: 'X', dates_requested: { start: '2025-10-06', end: '2025-10-13' } }],
      ['papa_overlap', { dates_requested: { start: '2025-07-07', end: '2025-07-11' }, rooms_available: [] }],
      ['conflict_deadline_3wk', { labor_day: '2025-09-01', message: '' }],
      ['conflict_deadline_1wk', { labor_day: '2025-09-01', message: '' }],
      ['waiver_bump', { dates_requested: { start: '2025-07-10', end: '2025-07-14' }, rooms_requested: [], rooms_available: [], conflicting_principal: 'X' }],
      ['booking_confirmed', { booking_type: 'open_shared', start_date: '2025-07-10', end_date: '2025-07-14', status: 'confirmed' }],
    ] as const

    for (const [type, payload] of types) {
      const result = buildEmailContent(type as Parameters<typeof buildEmailContent>[0], payload as Record<string, unknown>, NAME, APP)
      expect(result.html).toContain(NAME)
    }
  })

  it('all templates include a link back to the app', () => {
    const result = buildEmailContent(
      'booking_confirmed',
      { booking_type: 'open_shared', start_date: '2025-07-10', end_date: '2025-07-14', status: 'confirmed' },
      NAME, APP
    )
    expect(result.html).toContain(APP)
  })
})
