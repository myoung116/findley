import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateScoresForPrincipals, type BookingRecord } from '@/lib/waiver/calculate'

// Vercel Cron calls this with a secret header — reject anything else
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all principals (papa is exempt from waiver, skip)
  const { data: principalsData } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'principal')

  const principals = (principalsData ?? []) as { id: string }[]
  if (principals.length === 0) {
    return NextResponse.json({ message: 'No principals found', updated: 0 })
  }

  const principalIds = principals.map(p => p.id)

  // Fetch all waiver-eligible confirmed bookings for these principals in the last 13 months
  // (extra month buffer to safely cover the full TTM window)
  const since = new Date()
  since.setMonth(since.getMonth() - 13)

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('id, user_id, booking_type, start_date, end_date, rooms_requested, status')
    .in('user_id', principalIds)
    .in('booking_type', ['open_shared', 'lastminute_guest'])
    .eq('status', 'confirmed')
    .gte('start_date', since.toISOString().split('T')[0])

  type RawBooking = {
    id: string; user_id: string; booking_type: string
    start_date: string; end_date: string; rooms_requested: string[]; status: string
  }

  const bookings: BookingRecord[] = ((bookingsData ?? []) as RawBooking[]).map(b => ({
    id: b.id,
    userId: b.user_id,
    bookingType: b.booking_type as BookingRecord['bookingType'],
    startDate: b.start_date,
    endDate: b.end_date,
    roomsRequested: b.rooms_requested,
    status: b.status as BookingRecord['status'],
  }))

  const referenceDate = new Date()
  const scores = calculateScoresForPrincipals(principalIds, bookings, referenceDate)

  // Upsert scores — insert a new row per calculation run (append-only for history)
  const { error } = await supabase.from('waiver_scores').insert(
    scores.map(s => ({
      user_id: s.userId,
      score: s.score,
      nights_ttm: s.nightsTtm,
      requests_ttm: s.requestsTtm,
      calculated_at: referenceDate.toISOString(),
    }))
  )

  if (error) {
    console.error('waiver cron error:', error)
    return NextResponse.json({ error: 'Failed to write scores' }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Waiver scores updated',
    updated: scores.length,
    scores: scores.map(s => ({ userId: s.userId, score: s.score })),
  })
}
