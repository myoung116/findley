import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCyclePhase } from '@/lib/booking/cycle'
import { getLaborDay } from '@/lib/booking/seasons'
import { format, addDays } from 'date-fns'

function isAuthorized(req: Request): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const phase = getCyclePhase(today)

  if (!phase) {
    return NextResponse.json({ message: 'No cycle phase today', date: format(today, 'yyyy-MM-dd') })
  }

  const supabase = await createClient()
  const results: string[] = []

  // ── Memorial Day: open off-season exclusive drafts ──────────────────────────
  if (phase === 'memorial_day_open') {
    const { data: drafts, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_type', 'exclusive_offseason')
      .eq('status', 'draft')

    if (!error && drafts && drafts.length > 0) {
      const ids = (drafts as { id: string }[]).map(d => d.id)
      await supabase
        .from('bookings')
        .update({ status: 'pending' })
        .in('id', ids)
      results.push(`Opened ${ids.length} off-season exclusive draft(s) → pending`)
    } else {
      results.push('No off-season exclusive drafts to open')
    }
  }

  // ── Conflict deadline notices (~3 weeks and ~1 week before Labor Day) ────────
  if (phase === 'conflict_deadline_3wk' || phase === 'conflict_deadline_1wk') {
    const notifType = phase === 'conflict_deadline_3wk'
      ? 'conflict_deadline_3wk'
      : 'conflict_deadline_1wk'

    // Find all principals who have at least one open conflict on an exclusive block
    const { data: openConflicts } = await supabase
      .from('conflicts')
      .select(`
        booking_a:bookings!conflicts_booking_id_a_fkey(user_id),
        booking_b:bookings!conflicts_booking_id_b_fkey(user_id)
      `)
      .eq('status', 'open')

    type ConflictUserRow = {
      booking_a: { user_id: string } | null
      booking_b: { user_id: string } | null
    }

    const affectedUserIds = new Set<string>()
    for (const c of (openConflicts ?? []) as ConflictUserRow[]) {
      if (c.booking_a?.user_id) affectedUserIds.add(c.booking_a.user_id)
      if (c.booking_b?.user_id) affectedUserIds.add(c.booking_b.user_id)
    }

    if (affectedUserIds.size > 0) {
      const laborDay = getLaborDay(today.getFullYear())
      await supabase.from('notifications').insert(
        Array.from(affectedUserIds).map(userId => ({
          user_id: userId,
          type: notifType as 'conflict_deadline_3wk' | 'conflict_deadline_1wk',
          payload: {
            labor_day: format(laborDay, 'yyyy-MM-dd'),
            message: phase === 'conflict_deadline_3wk'
              ? 'Reminder: off-season exclusive block conflicts must be resolved before Labor Day. You have approximately 3 weeks.'
              : 'Final notice: off-season exclusive block conflicts must be resolved within the week. Labor Day lock-in is approaching.',
          },
        }))
      )
      results.push(`Sent ${notifType} notices to ${affectedUserIds.size} principal(s)`)
    } else {
      results.push('No open conflicts — no deadline notices needed')
    }
  }

  // ── Labor Day: lock in all pending off-season exclusive blocks ───────────────
  if (phase === 'labor_day_lockin') {
    const laborDay = getLaborDay(today.getFullYear())
    // Lock in blocks that start in the off-season beginning after this Labor Day
    const offseasonStart = format(addDays(laborDay, 1), 'yyyy-MM-dd')

    const { data: pendingBlocks } = await supabase
      .from('bookings')
      .select('id, user_id, start_date, end_date')
      .eq('booking_type', 'exclusive_offseason')
      .eq('status', 'pending')
      .gte('start_date', offseasonStart)

    type BlockRow = { id: string; user_id: string; start_date: string; end_date: string }
    const blocks = (pendingBlocks ?? []) as BlockRow[]

    if (blocks.length > 0) {
      const ids = blocks.map(b => b.id)
      await supabase.from('bookings').update({ status: 'confirmed' }).in('id', ids)

      // Notify each principal that their block is confirmed
      await supabase.from('notifications').insert(
        blocks.map(b => ({
          user_id: b.user_id,
          type: 'booking_confirmed' as const,
          payload: {
            booking_id: b.id,
            booking_type: 'exclusive_offseason',
            start_date: b.start_date,
            end_date: b.end_date,
            message: 'Your off-season exclusive block has been confirmed at Labor Day lock-in.',
          },
        }))
      )

      // Close any conflicts that are now locked in
      await supabase
        .from('conflicts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .in('booking_id_a', ids)

      await supabase
        .from('conflicts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .in('booking_id_b', ids)

      results.push(`Locked in ${blocks.length} off-season exclusive block(s) → confirmed`)
    } else {
      results.push('No pending off-season exclusive blocks to lock in')
    }

    // Notify any interested principals whose flagged week is now confirmed
    const { data: interests } = await supabase
      .from('interests')
      .select('user_id, week_start_date')

    type InterestRow = { user_id: string; week_start_date: string }
    for (const interest of (interests ?? []) as InterestRow[]) {
      const matchingBlock = blocks.find(b => {
        const blockStart = new Date(b.start_date)
        const interestDate = new Date(interest.week_start_date)
        return blockStart <= interestDate && interestDate <= new Date(b.end_date)
      })
      if (matchingBlock && matchingBlock.user_id !== interest.user_id) {
        await supabase.from('notifications').insert({
          user_id: interest.user_id,
          type: 'booking_confirmed',
          payload: {
            message: `A week you flagged interest in has been confirmed by another principal.`,
            start_date: matchingBlock.start_date,
            end_date: matchingBlock.end_date,
          },
        })
      }
    }
  }

  return NextResponse.json({ phase, date: format(today, 'yyyy-MM-dd'), results })
}
