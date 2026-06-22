'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateBookingDates, validateOffseasonGap } from '@/lib/booking/validation'
import { getSeasonForBooking } from '@/lib/booking/seasons'
import { decideBump, roomsConflict } from '@/lib/conflicts/bump'
import type { BookingType, UserRole, FamilyBranch } from '@/lib/supabase/types'

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

type ConflictRow = {
  id: string
  user_id: string
  rooms_requested: string[]
  start_date: string
  end_date: string
  created_at: string
  users: { name: string; role: string } | null
}

export async function submitBooking(payload: BookingPayload): Promise<SubmitResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users')
    .select('id, role, name, family_branch')
    .eq('id', user.id)
    .single()

  const profile = profileData as { id: string; role: UserRole; name: string; family_branch: FamilyBranch } | null
  if (!profile || !['admin', 'papa', 'principal', 'cousin'].includes(profile.role)) {
    return { success: false, error: 'You are not permitted to submit bookings.' }
  }

  // Cousins can only submit non-exclusive booking types
  const isExclusive = payload.bookingType === 'exclusive_peak' || payload.bookingType === 'exclusive_offseason'
  if (profile.role === 'cousin' && isExclusive) {
    return { success: false, error: 'Cousins may only submit open or last-minute bookings.' }
  }

  // --- Branch policies: rules a principal set for the cousins in their branch ---
  // Only apply to cousins; principals/papa/admin are not governed by these.
  let cousinNeedsApproval = false
  if (profile.role === 'cousin') {
    const { data: policyData } = await supabase
      .from('branch_policies')
      .select('require_cousin_approval, cousin_guest_cap')
      .eq('family_branch', profile.family_branch)
      .maybeSingle()

    const policy = policyData as { require_cousin_approval: boolean; cousin_guest_cap: number | null } | null

    if (policy?.cousin_guest_cap != null && payload.guestCount > policy.cousin_guest_cap) {
      return {
        success: false,
        error: `Your family principal limits cousin bookings to ${policy.cousin_guest_cap} guest${policy.cousin_guest_cap === 1 ? '' : 's'}. Please reduce your guest count or ask your principal.`,
      }
    }

    cousinNeedsApproval = policy?.require_cousin_approval === true
  }

  if (!payload.acknowledgedResponsibility) {
    return { success: false, error: 'You must acknowledge responsibility for all guests.' }
  }

  if (payload.roomIds.length === 0) {
    return { success: false, error: 'You must select at least one room.' }
  }

  const start = new Date(payload.startDate)
  const end = new Date(payload.endDate)

  const dateValidation = validateBookingDates(start, end, payload.bookingType)
  if (!dateValidation.valid) {
    return { success: false, error: dateValidation.error }
  }

  // Off-season exclusive: gap + 2-block-per-season limit
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
      if (!gapCheck.valid) return { success: false, error: gapCheck.error }
    }

    const seasonYear = start.getMonth() >= 8 ? start.getFullYear() : start.getFullYear() - 1
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('booking_type', 'exclusive_offseason')
      .in('status', ['draft', 'pending', 'confirmed'])
      .gte('start_date', `${seasonYear}-09-01`)
      .lte('start_date', `${seasonYear + 1}-05-31`)

    if ((count ?? 0) >= 2) {
      return { success: false, error: 'You have already used both off-season exclusive blocks for this season.' }
    }
  }

  // Peak exclusive: 1-block-per-year limit
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

  // Find all overlapping active bookings that share at least one room
  const { data: overlappingRaw } = await supabase
    .from('bookings')
    .select('id, user_id, rooms_requested, start_date, end_date, created_at, users(name, role)')
    .in('status', ['pending', 'confirmed'])
    .neq('user_id', user.id)
    .lte('start_date', payload.endDate)
    .gte('end_date', payload.startDate)

  const overlapping = (overlappingRaw ?? []) as ConflictRow[]
  const roomConflicts = overlapping.filter(b => roomsConflict(payload.roomIds, b.rooms_requested))

  // Get submitting principal's current waiver score
  const { data: myScoreData } = await supabase
    .from('waiver_scores')
    .select('score, nights_ttm, requests_ttm')
    .eq('user_id', user.id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()

  const myScore = myScoreData as { score: number; nights_ttm: number; requests_ttm: number } | null

  // --- Insert the booking first so we have an ID ---
  const season = getSeasonForBooking(start)
  // Exclusive bookings always need admin approval. Non-exclusive auto-confirm,
  // except cousins whose branch principal requires approval first.
  const initialStatus = (isExclusive || cousinNeedsApproval) ? 'pending' : 'confirmed'

  const { data: bookingData, error: insertError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      start_date: payload.startDate,
      end_date: payload.endDate,
      booking_type: payload.bookingType,
      status: initialStatus,
      season,
      rooms_requested: payload.roomIds,
      guest_count: payload.guestCount,
      notes: payload.notes || null,
    })
    .select('id, created_at')
    .single()

  const booking = bookingData as { id: string; created_at: string } | null
  if (insertError || !booking) {
    return { success: false, error: 'Failed to submit booking. Please try again.' }
  }

  // If this cousin booking needs branch-principal approval, notify the principal(s)
  // of the cousin's branch. Use the admin client: a cousin can't read other
  // users' rows or write notifications for them under RLS.
  if (cousinNeedsApproval) {
    const admin = createAdminClient()
    const { data: principals } = await admin
      .from('users')
      .select('id')
      .eq('role', 'principal')
      .eq('family_branch', profile.family_branch)

    const principalRows = (principals ?? []) as { id: string }[]
    if (principalRows.length > 0) {
      await admin.from('notifications').insert(
        principalRows.map(p => ({
          user_id: p.id,
          type: 'cousin_pending_approval' as const,
          payload: {
            booking_id: booking.id,
            cousin_name: profile.name,
            booking_type: payload.bookingType,
            start_date: payload.startDate,
            end_date: payload.endDate,
            guest_count: payload.guestCount,
            rooms_requested: payload.roomIds,
          },
        }))
      )
    }
  }

  // --- Handle room conflicts ---
  // Only admin retains auto-bump privilege
  // Only principal/cousin are subject to waiver-based bumping
  // Papa and all other roles go to conflict queue (social resolution)
  const isAdminSubmitter = profile.role === 'admin'
  const isSubjectToWaiver = profile.role === 'principal' || profile.role === 'cousin'
  const isPapa = isAdminSubmitter // keep variable name for existing bump block below

  // A cousin booking awaiting principal approval doesn't bump or conflict with
  // anyone yet — conflict resolution is deferred until the principal approves.
  for (const conflict of (cousinNeedsApproval ? [] : roomConflicts)) {
    const conflictingUserName = conflict.users?.name ?? 'Unknown'

    if (isPapa) {
      // Papa always wins — bump the conflicting booking
      await supabase
        .from('bookings')
        .update({ status: 'bumped' })
        .eq('id', conflict.id)

      // Get available rooms for bump notification
      const { data: allRooms } = await supabase
        .from('rooms')
        .select('id, name')

      const availableRooms = (allRooms ?? []).filter(
        r => !conflict.rooms_requested.includes(r.id) && !payload.roomIds.includes(r.id)
      )

      await supabase.from('notifications').insert({
        user_id: conflict.user_id,
        type: 'papa_overlap',
        payload: {
          dates_requested: { start: conflict.start_date, end: conflict.end_date },
          rooms_requested: conflict.rooms_requested,
          rooms_available: availableRooms.map(r => ({ id: r.id, name: (r as { id: string; name: string }).name })),
          conflicting_principal: 'Papa',
          booking_id: conflict.id,
        },
      })
    } else if (
      isSubjectToWaiver &&
      payload.bookingType === 'open_shared' &&
      conflict.rooms_requested.some(r => payload.roomIds.includes(r)) &&
      (conflict.users?.role === 'principal' || conflict.users?.role === 'cousin')
    ) {
      // Waiver-based bump only when both sides are principal/cousin
      const { data: theirScoreData } = await supabase
        .from('waiver_scores')
        .select('nights_ttm, requests_ttm')
        .eq('user_id', conflict.user_id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      const theirScore = theirScoreData as { nights_ttm: number; requests_ttm: number } | null

      const decision = decideBump(
        {
          bookingId: booking.id,
          userId: user.id,
          userName: profile.name,
          waiverInput: { bedroomNightsUsedTtm: myScore?.nights_ttm ?? 0, requestsMadeTtm: myScore?.requests_ttm ?? 0 },
          submittedAt: new Date(booking.created_at),
          roomsRequested: payload.roomIds,
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
        {
          bookingId: conflict.id,
          userId: conflict.user_id,
          userName: conflictingUserName,
          waiverInput: { bedroomNightsUsedTtm: theirScore?.nights_ttm ?? 0, requestsMadeTtm: theirScore?.requests_ttm ?? 0 },
          submittedAt: new Date(conflict.created_at),
          roomsRequested: conflict.rooms_requested,
          startDate: conflict.start_date,
          endDate: conflict.end_date,
        }
      )

      // Bump the loser
      await supabase
        .from('bookings')
        .update({ status: 'bumped' })
        .eq('id', decision.loserBookingId)

      // If the incoming booking lost, cancel it and return error
      if (decision.loserBookingId === booking.id) {
        await supabase.from('bookings').update({ status: 'bumped' }).eq('id', booking.id)

        const { data: allRooms } = await supabase.from('rooms').select('id, name')
        const bookedRoomIds = new Set(conflict.rooms_requested)
        const availableRooms = (allRooms ?? []).filter(r => !bookedRoomIds.has(r.id))

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'waiver_bump',
          payload: {
            dates_requested: { start: payload.startDate, end: payload.endDate },
            rooms_requested: payload.roomIds,
            rooms_available: availableRooms.map(r => ({ id: r.id, name: (r as { id: string; name: string }).name })),
            conflicting_principal: conflictingUserName,
            booking_id: booking.id,
          },
        })

        return {
          success: false,
          error: `Your request was bumped by ${conflictingUserName} who has higher booking priority for those rooms. Check your notifications for available alternatives.`,
        }
      }

      // Incoming booking won — notify the loser
      const { data: allRooms } = await supabase.from('rooms').select('id, name')
      const bookedRoomIds = new Set(payload.roomIds)
      const availableRooms = (allRooms ?? []).filter(r => !bookedRoomIds.has(r.id))

      await supabase.from('notifications').insert({
        user_id: decision.loserUserId,
        type: 'waiver_bump',
        payload: {
          dates_requested: { start: conflict.start_date, end: conflict.end_date },
          rooms_requested: conflict.rooms_requested,
          rooms_available: availableRooms.map(r => ({ id: r.id, name: (r as { id: string; name: string }).name })),
          conflicting_principal: profile.name,
          booking_id: conflict.id,
        },
      })
    } else if (
      payload.bookingType !== 'open_shared' &&
      !isPapa
    ) {
      // Exclusive block hitting another booking — flag as conflict (social resolution)
      await supabase.from('conflicts').upsert(
        {
          booking_id_a: booking.id < conflict.id ? booking.id : conflict.id,
          booking_id_b: booking.id < conflict.id ? conflict.id : booking.id,
          status: 'open',
        },
        { onConflict: 'booking_id_a,booking_id_b' }
      )

      // Notify the other principal
      await supabase.from('notifications').insert({
        user_id: conflict.user_id,
        type: 'exclusive_overlap',
        payload: {
          dates_requested: { start: payload.startDate, end: payload.endDate },
          conflicting_principal: profile.name,
          booking_id: conflict.id,
        },
      })
    }
  }

  // Store guest details
  if (payload.guests.length > 0) {
    await supabase.from('sleep_assignments').insert(
      payload.roomIds.map(roomId => ({
        booking_id: booking.id,
        room_id: roomId,
        assigned_guests: payload.guests,
      }))
    )
  }

  // Notify the submitter that their booking was received
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'booking_confirmed',
    payload: {
      booking_id: booking.id,
      booking_type: payload.bookingType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      status: initialStatus,
    },
  })

  return { success: true, bookingId: booking.id }
}
