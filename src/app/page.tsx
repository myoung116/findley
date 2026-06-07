import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from '@/components/calendar/CalendarClient'
import type { UserRole, BookingType, BookingStatus } from '@/lib/supabase/types'
import type { CalendarBooking } from '@/lib/calendar/utils'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/login')

  const profile = profileData as { name: string; role: UserRole }
  const role = profile.role

  const bookingQuery = supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      start_date,
      end_date,
      booking_type,
      status,
      rooms_requested,
      guest_count,
      users ( name )
    `)
    .not('status', 'in', '(cancelled,bumped)')

  if (role === 'viewer') {
    bookingQuery.eq('status', 'confirmed')
  }

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
    .select('id, name, bed_count, max_occupancy')
    .order('name')

  return (
    <CalendarClient
      bookings={bookings}
      rooms={rooms ?? []}
      role={role}
      userName={profile.name}
    />
  )
}
