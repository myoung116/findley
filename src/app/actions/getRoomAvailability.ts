'use server'

import { createClient } from '@/lib/supabase/server'

export interface RoomAvailabilityResult {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
  attributes: Record<string, unknown>
  available: boolean
  conflictingBookingId: string | null
}

export async function getRoomAvailability(
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<RoomAvailabilityResult[]> {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, bed_count, max_occupancy, attributes')
    .order('sort_order')

  if (!rooms) return []

  // Find all active bookings that overlap the requested date range
  let conflictQuery = supabase
    .from('bookings')
    .select('id, rooms_requested')
    .in('status', ['pending', 'confirmed'])
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (excludeBookingId) {
    conflictQuery = conflictQuery.neq('id', excludeBookingId)
  }

  type ConflictRow = { id: string; rooms_requested: string[] }
  const { data: conflicts } = await conflictQuery

  const bookedRoomIds = new Set<string>(
    (conflicts as ConflictRow[] ?? []).flatMap(b => b.rooms_requested)
  )

  const conflictMap = new Map<string, string>()
  for (const booking of conflicts as ConflictRow[] ?? []) {
    for (const roomId of booking.rooms_requested) {
      if (!conflictMap.has(roomId)) {
        conflictMap.set(roomId, booking.id)
      }
    }
  }

  type RoomRow = { id: string; name: string; bed_count: number; max_occupancy: number; attributes: unknown }
  return (rooms as RoomRow[]).map(room => ({
    id: room.id,
    name: room.name,
    bed_count: room.bed_count,
    max_occupancy: room.max_occupancy,
    attributes: (room.attributes ?? {}) as Record<string, unknown>,
    available: !bookedRoomIds.has(room.id),
    conflictingBookingId: conflictMap.get(room.id) ?? null,
  }))
}
