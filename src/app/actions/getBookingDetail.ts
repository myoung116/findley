'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BookingType, BookingStatus, FamilyBranch } from '@/lib/supabase/types'
import type { RosterMember } from './getBranchRoster'

export interface BookingDetail {
  id: string
  startDate: string
  endDate: string
  bookingType: BookingType
  status: BookingStatus
  notes: string
  adultCount: number
  kidCount: number
  roomIds: string[]
  memberIds: string[]
  guests: Array<{ name: string; relationship: string; isChild?: boolean }>
  roster: RosterMember[] // the booking owner's branch roster
}

export async function getBookingDetail(
  bookingId: string
): Promise<{ detail?: BookingDetail; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile) return { error: 'Profile not found.' }

  const admin = createAdminClient()
  const { data: bookingData } = await admin
    .from('bookings')
    .select('id, user_id, start_date, end_date, booking_type, status, notes, adult_count, kid_count, rooms_requested')
    .eq('id', bookingId)
    .single()

  const booking = bookingData as {
    id: string; user_id: string; start_date: string; end_date: string
    booking_type: BookingType; status: BookingStatus; notes: string | null
    adult_count: number; kid_count: number; rooms_requested: string[]
  } | null
  if (!booking) return { error: 'Booking not found.' }

  const isOwner = booking.user_id === user.id
  if (profile.role !== 'admin' && !isOwner) {
    return { error: 'You are not permitted to edit this booking.' }
  }

  // Owner's branch + roster (admins may be editing another branch's booking).
  const { data: ownerData } = await admin
    .from('users').select('family_branch').eq('id', booking.user_id).single()
  const ownerBranch = (ownerData as { family_branch: FamilyBranch } | null)?.family_branch

  let roster: RosterMember[] = []
  if (ownerBranch) {
    const { data: memberRows } = await admin
      .from('branch_members')
      .select('id, name, is_child, linked_user_id')
      .eq('family_branch', ownerBranch)
      .order('name')
    type MRow = { id: string; name: string; is_child: boolean; linked_user_id: string | null }
    roster = ((memberRows ?? []) as MRow[]).map(m => ({
      id: m.id, name: m.name, isChild: m.is_child, isSelf: m.linked_user_id === booking.user_id,
    }))
  }

  const { data: memberLinks } = await admin
    .from('booking_members').select('member_id').eq('booking_id', bookingId)
  const memberIds = ((memberLinks ?? []) as { member_id: string }[]).map(m => m.member_id)

  // External guests are stored (denormalized) on sleep_assignments; one row's
  // assigned_guests is representative for the whole booking.
  const { data: saRows } = await admin
    .from('sleep_assignments').select('assigned_guests').eq('booking_id', bookingId).limit(1)
  const guests = (((saRows ?? [])[0] as { assigned_guests: unknown } | undefined)?.assigned_guests
    ?? []) as Array<{ name: string; relationship: string; isChild?: boolean }>

  return {
    detail: {
      id: booking.id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      bookingType: booking.booking_type,
      status: booking.status,
      notes: booking.notes ?? '',
      adultCount: booking.adult_count,
      kidCount: booking.kid_count,
      roomIds: booking.rooms_requested ?? [],
      memberIds,
      guests,
      roster,
    },
  }
}
