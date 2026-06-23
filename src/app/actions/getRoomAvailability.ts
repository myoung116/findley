'use server'

import { createClient } from '@/lib/supabase/server'
import type { BookingType } from '@/lib/supabase/types'

export interface RoomAvailabilityResult {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
  flex_capacity: number
  attributes: Record<string, unknown>
  available: boolean
  // Sleeping capacity (beds + flex) and how many spots remain after existing
  // overlapping stays. For shared rooms `remaining` drives how many more can fit.
  capacity: number
  remaining: number
  // True when the room already holds other parties this stay would share with.
  shared: boolean
  conflictingBookingId: string | null
}

const EXCLUSIVE_TYPES: BookingType[] = ['exclusive_offseason', 'exclusive_peak']
function isExclusive(t: BookingType) { return EXCLUSIVE_TYPES.includes(t) }

export async function getRoomAvailability(
  startDate: string,
  endDate: string,
  excludeBookingId?: string,
  // The type/size of the booking being created. Non-exclusive stays may share a
  // room up to capacity; exclusive blocks require the whole room.
  bookingType?: BookingType,
  partySize = 1
): Promise<RoomAvailabilityResult[]> {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, bed_count, max_occupancy, flex_capacity, attributes')
    .order('sort_order')

  if (!rooms) return []

  // Overlapping active bookings (with type + headcount for capacity math).
  let conflictQuery = supabase
    .from('bookings')
    .select('id, rooms_requested, booking_type, guest_count')
    .in('status', ['pending', 'confirmed'])
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (excludeBookingId) {
    conflictQuery = conflictQuery.neq('id', excludeBookingId)
  }

  type ConflictRow = { id: string; rooms_requested: string[]; booking_type: BookingType; guest_count: number }
  const { data: conflicts } = await conflictQuery
  const overlapping = (conflicts as ConflictRow[]) ?? []

  const prospectiveExclusive = bookingType ? isExclusive(bookingType) : true

  type RoomRow = { id: string; name: string; bed_count: number; max_occupancy: number; flex_capacity: number; attributes: unknown }
  return (rooms as RoomRow[]).map(room => {
    const occupants = overlapping.filter(b => b.rooms_requested.includes(room.id))
    const hasExclusiveOccupant = occupants.some(b => isExclusive(b.booking_type))
    const usedSpots = occupants.reduce((sum, b) => sum + (b.guest_count ?? 0), 0)
    const capacity = room.max_occupancy + (room.flex_capacity ?? 0)
    const remaining = Math.max(0, capacity - usedSpots)

    // Availability depends on the booking being created:
    //  - exclusive: needs the whole room (no existing occupants)
    //  - shared: may join unless an exclusive holds it or it's full for this party
    const available = prospectiveExclusive
      ? occupants.length === 0
      : !hasExclusiveOccupant && remaining >= partySize

    return {
      id: room.id,
      name: room.name,
      bed_count: room.bed_count,
      max_occupancy: room.max_occupancy,
      flex_capacity: room.flex_capacity ?? 0,
      attributes: (room.attributes ?? {}) as Record<string, unknown>,
      available,
      capacity,
      remaining,
      shared: occupants.length > 0 && !hasExclusiveOccupant,
      conflictingBookingId: occupants[0]?.id ?? null,
    }
  })
}
