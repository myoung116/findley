'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { roomsConflict } from '@/lib/conflicts/bump'
import type { FamilyBranch } from '@/lib/supabase/types'
import type { Database } from '@/lib/supabase/database.types'

type BookingUpdate = Database['public']['Tables']['bookings']['Update']

interface UpdateBookingPayload {
  notes?: string
  startDate?: string
  endDate?: string
  roomIds?: string[]
  adultCount?: number
  kidCount?: number
  guestCount?: number
  memberIds?: string[]
  guests?: Array<{ name: string; relationship: string; isChild?: boolean }>
}

export async function updateBooking(
  bookingId: string,
  payload: UpdateBookingPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profileData } = await supabase.from('users').select('role, family_branch').eq('id', user.id).single()
  const profile = profileData as { role: string; family_branch: FamilyBranch } | null
  if (!profile) return { success: false, error: 'Profile not found' }

  const admin = createAdminClient()
  const { data: bookingData } = await admin
    .from('bookings').select('user_id, end_date, rooms_requested').eq('id', bookingId).single()
  const booking = bookingData as { user_id: string; end_date: string; rooms_requested: string[] } | null
  if (!booking) return { success: false, error: 'Booking not found' }

  // Owner's branch (for authorization + validating member ids).
  const { data: ownerData } = await admin
    .from('users').select('family_branch').eq('id', booking.user_id).single()
  const ownerBranch = (ownerData as { family_branch: FamilyBranch } | null)?.family_branch

  // Authorization: admin (any), owner, or the principal of the owner's branch.
  const isAdmin = profile.role === 'admin'
  const isOwner = booking.user_id === user.id
  const isBranchPrincipal = profile.role === 'principal' && profile.family_branch === ownerBranch
  if (!isAdmin && !isOwner && !isBranchPrincipal) return { success: false, error: 'Not authorized' }

  const isPast = new Date(booking.end_date) < new Date()
  if (isPast && !isAdmin) return { success: false, error: 'Past bookings can only be modified by the administrator.' }

  // If dates or rooms changed, make sure the requested rooms are free in the new
  // window (excluding this booking). Edits don't run the bump/waiver cascade.
  const newRooms = payload.roomIds
  const newStart = payload.startDate
  const newEnd = payload.endDate
  if ((newRooms || newStart || newEnd)) {
    const rooms = newRooms ?? booking.rooms_requested
    const start = newStart ?? undefined
    const end = newEnd ?? undefined
    if (rooms.length === 0) return { success: false, error: 'Select at least one room.' }
    if (start && end && start >= end) return { success: false, error: 'Checkout must be after check-in.' }

    if (start && end) {
      const { data: overlapping } = await admin
        .from('bookings')
        .select('id, rooms_requested')
        .in('status', ['pending', 'confirmed'])
        .neq('id', bookingId)
        .lte('start_date', end)
        .gte('end_date', start)
      const clash = ((overlapping ?? []) as { id: string; rooms_requested: string[] }[])
        .some(b => roomsConflict(rooms, b.rooms_requested))
      if (clash) {
        return { success: false, error: 'One or more of those rooms is already booked for these dates.' }
      }
    }
  }

  const update: BookingUpdate = {}
  if (payload.notes !== undefined) update.notes = payload.notes || null
  if (payload.startDate !== undefined) update.start_date = payload.startDate
  if (payload.endDate !== undefined) update.end_date = payload.endDate
  if (payload.roomIds !== undefined) update.rooms_requested = payload.roomIds
  if (payload.adultCount !== undefined) update.adult_count = payload.adultCount
  if (payload.kidCount !== undefined) update.kid_count = payload.kidCount
  if (payload.guestCount !== undefined) update.guest_count = payload.guestCount

  if (Object.keys(update).length > 0) {
    const { error } = await admin.from('bookings').update(update).eq('id', bookingId)
    if (error) return { success: false, error: error.message }
  }

  // Replace named attendees (validate against the owner's branch).
  if (payload.memberIds !== undefined) {
    await admin.from('booking_members').delete().eq('booking_id', bookingId)
    if (payload.memberIds.length > 0 && ownerBranch) {
      const { data: valid } = await admin
        .from('branch_members').select('id')
        .eq('family_branch', ownerBranch)
        .in('id', payload.memberIds)
      const validIds = ((valid ?? []) as { id: string }[]).map(m => m.id)
      if (validIds.length > 0) {
        await admin.from('booking_members').insert(
          validIds.map(memberId => ({ booking_id: bookingId, member_id: memberId }))
        )
      }
    }
  }

  // Replace external guest details across the booking's rooms.
  if (payload.guests !== undefined) {
    await admin.from('sleep_assignments').delete().eq('booking_id', bookingId)
    if (payload.guests.length > 0) {
      const rooms = payload.roomIds ?? booking.rooms_requested
      if (rooms.length > 0) {
        await admin.from('sleep_assignments').insert(
          rooms.map(roomId => ({ booking_id: bookingId, room_id: roomId, assigned_guests: payload.guests }))
        )
      }
    }
  }

  return { success: true }
}
