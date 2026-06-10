import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from '@/components/calendar/CalendarClient'
import { differenceInDays, parseISO, subMonths } from 'date-fns'
import type { UserRole, BookingType, BookingStatus } from '@/lib/supabase/types'
import type { CalendarBooking } from '@/lib/calendar/utils'

export type ExclusiveUsage = {
  peakUsed: number      // max 1 per calendar year
  offseasonUsed: number // max 2 per season
}

export type DashboardStats = {
  totalNights: number
  totalVisits: number
  ttmNights: number
  ttmVisits: number
  waiverScore: number | null
  exclusiveUsage: ExclusiveUsage
  upcomingBookings: DashboardBooking[]
  pastBookings: DashboardBooking[]
}

export type DashboardBooking = {
  id: string
  startDate: string
  endDate: string
  bookingType: BookingType
  status: BookingStatus
  nights: number
  guestCount: number
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('name, role, family_branch')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/login')

  const profile = profileData as { name: string; role: UserRole; family_branch: string }
  const role = profile.role

  // All visible bookings for the calendar
  const bookingQuery = supabase
    .from('bookings')
    .select(`id, user_id, start_date, end_date, booking_type, status, rooms_requested, guest_count, users ( name )`)
    .not('status', 'in', '(cancelled,bumped)')

  // Cousins can now book so they see their own pending too (handled by RLS)
  // No special filter needed here — RLS handles it per-role

  const { data: rawBookings } = await bookingQuery

  type RawBooking = {
    id: string; user_id: string; start_date: string; end_date: string
    booking_type: BookingType; status: BookingStatus; rooms_requested: string[]
    guest_count: number; users: { name: string } | null
  }
  const bookings: CalendarBooking[] = ((rawBookings ?? []) as RawBooking[]).map(b => ({
    id: b.id,
    userId: b.user_id,
    userName: b.users?.name ?? 'Unknown',
    startDate: b.start_date,
    endDate: b.end_date,
    bookingType: b.booking_type,
    status: b.status,
    roomsRequested: b.rooms_requested ?? [],
    guestCount: b.guest_count,
  }))

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, bed_count, max_occupancy, attributes')
    .order('sort_order')

  // Dashboard: user's own bookings (all time, confirmed)
  const { data: myBookingsRaw } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, booking_type, status, guest_count')
    .eq('user_id', user.id)
    .not('status', 'in', '(cancelled,bumped)')
    .order('start_date', { ascending: false })

  type MyBooking = { id: string; start_date: string; end_date: string; booking_type: BookingType; status: BookingStatus; guest_count: number }
  const myBookings = (myBookingsRaw ?? []) as MyBooking[]

  const today = new Date()
  const ttmCutoff = subMonths(today, 12)

  const confirmed = myBookings.filter(b => b.status === 'confirmed')

  function nights(b: MyBooking) { return Math.max(0, differenceInDays(parseISO(b.end_date), parseISO(b.start_date))) }

  const totalNights = confirmed.reduce((s, b) => s + nights(b), 0)
  const totalVisits = confirmed.length
  const ttm = confirmed.filter(b => parseISO(b.start_date) >= ttmCutoff)
  const ttmNights = ttm.reduce((s, b) => s + nights(b), 0)
  const ttmVisits = ttm.length

  // Exclusive usage counters for principals
  const currentYear = today.getFullYear()
  const { count: peakUsed } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('booking_type', 'exclusive_peak')
    .in('status', ['draft', 'pending', 'confirmed'])
    .gte('start_date', `${currentYear}-01-01`)
    .lte('start_date', `${currentYear}-12-31`)

  // Off-season season runs Sep–May; season year = Sep year
  const seasonYear = today.getMonth() >= 8 ? currentYear : currentYear - 1
  const { count: offseasonUsed } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('booking_type', 'exclusive_offseason')
    .in('status', ['draft', 'pending', 'confirmed'])
    .gte('start_date', `${seasonYear}-09-01`)
    .lte('start_date', `${seasonYear + 1}-05-31`)

  const exclusiveUsage: ExclusiveUsage = { peakUsed: peakUsed ?? 0, offseasonUsed: offseasonUsed ?? 0 }

  // Latest waiver score
  const { data: scoreRow } = await supabase
    .from('waiver_scores')
    .select('score')
    .eq('user_id', user.id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const waiverScore = (scoreRow as { score: number } | null)?.score ?? null

  const upcoming = myBookings
    .filter(b => parseISO(b.end_date) >= today)
    .map(b => ({ id: b.id, startDate: b.start_date, endDate: b.end_date, bookingType: b.booking_type, status: b.status, nights: nights(b), guestCount: b.guest_count }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const past = confirmed
    .filter(b => parseISO(b.end_date) < today)
    .slice(0, 8)
    .map(b => ({ id: b.id, startDate: b.start_date, endDate: b.end_date, bookingType: b.booking_type, status: b.status, nights: nights(b), guestCount: b.guest_count }))

  const dashboard: DashboardStats = { totalNights, totalVisits, ttmNights, ttmVisits, waiverScore, exclusiveUsage, upcomingBookings: upcoming, pastBookings: past }

  return (
    <CalendarClient
      bookings={bookings}
      rooms={(rooms ?? []) as Parameters<typeof CalendarClient>[0]['rooms']}
      role={role}
      userName={profile.name}
      familyBranch={profile.family_branch}
      dashboard={dashboard}
    />
  )
}
