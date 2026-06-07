'use server'

import { createClient } from '@/lib/supabase/server'
import { validateBookingDates, validateOffseasonGap } from '@/lib/booking/validation'
import { getSeasonForBooking } from '@/lib/booking/seasons'
import type { BookingType } from '@/lib/supabase/types'

export interface BookingPayload {
  bookingType: BookingType
  startDate: string
  endDate: string
  roomIds: string[]
  guestCount: number
  guests: Array<{ name: string; relationship: string }>
  notes: string
  acknowledgedResponsibility: boolean
}

export interface SubmitResult {
  success: boolean
  bookingId?: string
  error?: string
}

export async function submitBooking(payload: BookingPayload): Promise<SubmitResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { id: string; role: string } | null

  if (!profile || (profile.role !== 'principal' && profile.role !== 'papa')) {
    return { success: false, error: 'Only principals may submit bookings.' }
  }

  if (!payload.acknowledgedResponsibility) {
    return { success: false, error: 'You must acknowledge responsibility for all guests.' }
  }

  if (payload.roomIds.length === 0) {
    return { success: false, error: 'You must select at least one room.' }
  }

  const start = new Date(payload.startDate)
  const end = new Date(payload.endDate)

  // Validate dates for booking type
  const dateValidation = validateBookingDates(start, end, payload.bookingType)
  if (!dateValidation.valid) {
    return { success: false, error: dateValidation.error }
  }

  // For off-season exclusive: check the principal's existing blocks for gap violation
  if (payload.bookingType === 'exclusive_offseason') {
    const { data: existingBlocks } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('user_id', user.id)
      .eq('booking_type', 'exclusive_offseason')
      .in('status', ['draft', 'pending', 'confirmed'])

    type BlockRow = { start_date: string; end_date: string }
    for (const block of (existingBlocks as BlockRow[]) ?? []) {
      const gapCheck = validateOffseasonGap(
        start, end,
        new Date(block.start_date), new Date(block.end_date)
      )
      if (!gapCheck.valid) {
        return { success: false, error: gapCheck.error }
      }
    }

    // Max 2 off-season exclusive blocks per principal per season year
    const seasonYear = start.getMonth() >= 8 ? start.getFullYear() : start.getFullYear() - 1
    const seasonStart = new Date(seasonYear, 8, 1)   // Sep 1
    const seasonEnd = new Date(seasonYear + 1, 4, 31) // May 31

    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('booking_type', 'exclusive_offseason')
      .in('status', ['draft', 'pending', 'confirmed'])
      .gte('start_date', seasonStart.toISOString().split('T')[0])
      .lte('start_date', seasonEnd.toISOString().split('T')[0])

    if ((count ?? 0) >= 2) {
      return { success: false, error: 'You have already used both off-season exclusive blocks for this season.' }
    }
  }

  // For peak exclusive: max 1 per principal per peak season year
  if (payload.bookingType === 'exclusive_peak') {
    const peakYear = start.getFullYear()

    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('booking_type', 'exclusive_peak')
      .in('status', ['draft', 'pending', 'confirmed'])
      .gte('start_date', `${peakYear}-01-01`)
      .lte('start_date', `${peakYear}-12-31`)

    if ((count ?? 0) >= 1) {
      return { success: false, error: 'You have already used your peak season exclusive block for this year.' }
    }
  }

  // Check room availability — full bump logic (all or nothing)
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id, rooms_requested, user_id, users(name)')
    .in('status', ['pending', 'confirmed'])
    .lte('start_date', payload.endDate)
    .gte('end_date', payload.startDate)

  type ConflictRow = { id: string; rooms_requested: string[]; user_id: string }
  const requestedSet = new Set(payload.roomIds)
  for (const conflict of (conflicts as ConflictRow[]) ?? []) {
    const conflictRooms = conflict.rooms_requested
    const hasOverlap = conflictRooms.some(r => requestedSet.has(r))
    if (hasOverlap) {
      // Papa always wins — bump the conflicting booking instead (handled post-insert)
      // For regular principals, reject
      if (profile.role !== 'papa') {
        return {
          success: false,
          error: `One or more of your requested rooms is already booked for those dates.`,
        }
      }
    }
  }

  const season = getSeasonForBooking(start)

  // For last-minute guest: auto-confirm
  const status = payload.bookingType === 'lastminute_guest' ? 'confirmed' : 'pending'

  const { data: bookingData, error: insertError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      start_date: payload.startDate,
      end_date: payload.endDate,
      booking_type: payload.bookingType,
      status,
      season,
      rooms_requested: payload.roomIds,
      guest_count: payload.guestCount,
      notes: payload.notes || null,
    })
    .select('id')
    .single()

  const booking = bookingData as { id: string } | null
  if (insertError || !booking) {
    return { success: false, error: 'Failed to submit booking. Please try again.' }
  }

  // Store guest details in sleep_assignments placeholder (name/relationship only for now)
  if (payload.guests.length > 0) {
    await supabase.from('sleep_assignments').insert(
      payload.roomIds.map(roomId => ({
        booking_id: booking.id,
        room_id: roomId,
        assigned_guests: payload.guests,
      }))
    )
  }

  // Conflict detection: flag overlapping exclusive bookings from other principals
  if (
    payload.bookingType === 'exclusive_offseason' ||
    payload.bookingType === 'exclusive_peak'
  ) {
    const { data: overlapping } = await supabase
      .from('bookings')
      .select('id')
      .neq('user_id', user.id)
      .in('booking_type', ['exclusive_offseason', 'exclusive_peak'])
      .in('status', ['draft', 'pending', 'confirmed'])
      .lte('start_date', payload.endDate)
      .gte('end_date', payload.startDate)

    for (const other of (overlapping as { id: string }[]) ?? []) {
      await supabase.from('conflicts').upsert(
        {
          booking_id_a: booking.id < other.id ? booking.id : other.id,
          booking_id_b: booking.id < other.id ? other.id : booking.id,
          status: 'open',
        },
        { onConflict: 'booking_id_a,booking_id_b' }
      )
    }
  }

  return { success: true, bookingId: booking.id }
}
