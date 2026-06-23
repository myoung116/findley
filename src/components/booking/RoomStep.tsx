'use client'

import { useEffect, useState, useTransition } from 'react'
import { getRoomAvailability, type RoomAvailabilityResult } from '@/app/actions/getRoomAvailability'
import type { BookingType } from '@/lib/supabase/types'

interface Props {
  startDate: string
  endDate: string
  selectedRoomIds: string[]
  totalGuests: number
  bookingType?: BookingType
  excludeBookingId?: string
  onToggleRoom: (roomId: string) => void
  onCapacityChange: (capacity: number) => void
}

const SHARED_TYPES: BookingType[] = ['open_shared', 'lastminute_guest']

interface RoomAttributes {
  floor?: number
  bathroom?: string
  beds?: string[]
  notes?: string
}

function formatBed(bed: string) {
  return bed.charAt(0).toUpperCase() + bed.slice(1)
}

function RoomDetails({ attributes }: { attributes: RoomAttributes }) {
  const beds = attributes.beds ?? []
  const bathroom = attributes.bathroom
  const floor = attributes.floor
  const notes = attributes.notes

  // Group bed types for compact display e.g. "2x Twin, 1x Full"
  const bedCounts: Record<string, number> = {}
  for (const bed of beds) {
    bedCounts[bed] = (bedCounts[bed] ?? 0) + 1
  }
  const bedSummary = Object.entries(bedCounts)
    .map(([type, count]) => `${count > 1 ? `${count}x ` : ''}${formatBed(type)}`)
    .join(', ')

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
      {bedSummary && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">Beds: </span>{bedSummary}
        </p>
      )}
      {bathroom && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">Bathroom: </span>
          {bathroom === 'private' ? 'Attached private' : 'Shared'}
        </p>
      )}
      {floor !== undefined && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">Floor: </span>
          {floor === 0 ? 'Garage' : `Floor ${floor}`}
        </p>
      )}
      {notes && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{notes}</p>
      )}
    </div>
  )
}

function RoomCard({
  room,
  selected,
  isShared,
  onToggle,
}: {
  room: RoomAvailabilityResult
  selected: boolean
  isShared: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const attrs = room.attributes as RoomAttributes

  return (
    <div className={`
      rounded-xl border-2 transition-all overflow-hidden
      ${!room.available
        ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-50'
        : selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
      }
    `}>
      {/* Main row — clicking selects/deselects */}
      <button
        type="button"
        disabled={!room.available}
        onClick={onToggle}
        className="w-full text-left p-3 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{room.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {room.bed_count} bed{room.bed_count !== 1 ? 's' : ''} &middot; sleeps {room.capacity}
              {room.flex_capacity > 0 && ` (${room.max_occupancy} beds +${room.flex_capacity} flex)`}
            </p>
            {isShared && room.shared && (
              <p className={`text-xs mt-0.5 font-medium ${room.remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                Shared · {room.remaining} of {room.capacity} spot{room.remaining === 1 ? '' : 's'} left
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!room.available && (
              <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                {isShared && room.shared && room.remaining <= 0 ? 'Full' : 'Booked'}
              </span>
            )}
            {room.available && selected && (
              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">&#10003;</span>
            )}
          </div>
        </div>
      </button>

      {/* Details toggle */}
      <div className="px-3 pb-2 -mt-1">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          {expanded ? 'Hide details' : 'Room details'}
        </button>
        {expanded && <RoomDetails attributes={attrs} />}
      </div>
    </div>
  )
}

export function RoomStep({ startDate, endDate, selectedRoomIds, totalGuests, bookingType, excludeBookingId, onToggleRoom, onCapacityChange }: Props) {
  const [rooms, setRooms] = useState<RoomAvailabilityResult[]>([])
  const [isPending, startTransition] = useTransition()
  const isShared = !!bookingType && SHARED_TYPES.includes(bookingType)

  useEffect(() => {
    if (!startDate || !endDate) return
    startTransition(async () => {
      const result = await getRoomAvailability(startDate, endDate, excludeBookingId, bookingType, Math.max(1, totalGuests))
      setRooms(result)
    })
  }, [startDate, endDate, excludeBookingId, bookingType, totalGuests])

  const selectedRooms = rooms.filter(r => selectedRoomIds.includes(r.id))
  // For shared stays the usable space is what's left in each room; for exclusive
  // stays it's the whole room.
  const totalCapacity = selectedRooms.reduce((sum, r) => sum + (isShared ? r.remaining : r.capacity), 0)
  const capacityOk = totalCapacity >= totalGuests
  const capacityShort = selectedRoomIds.length > 0 && !capacityOk

  useEffect(() => { onCapacityChange(totalCapacity) }, [totalCapacity, onCapacityChange])

  if (!startDate || !endDate) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Select dates first to see room availability.</p>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select rooms</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">Select all rooms your group needs. Tap &ldquo;Room details&rdquo; to see beds and bathroom info.</p>

      {isPending ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selectedRoomIds.includes(room.id)}
              isShared={isShared}
              onToggle={() => room.available && onToggleRoom(room.id)}
            />
          ))}
        </div>
      )}

      {/* Capacity summary */}
      {selectedRoomIds.length > 0 && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
          capacityShort
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
        }`}>
          <span className="mt-0.5">{capacityShort ? '(!)' : '(ok)'}</span>
          <div>
            <p className="font-medium">
              {selectedRoomIds.length} room{selectedRoomIds.length !== 1 ? 's' : ''} &middot; {isShared ? `${totalCapacity} open spot${totalCapacity === 1 ? '' : 's'}` : `sleeps ${totalCapacity}`}
            </p>
            {capacityShort ? (
              <p className="text-xs mt-0.5 opacity-80">
                Your party of {totalGuests} exceeds capacity. Add more rooms or reduce your guest count.
              </p>
            ) : (
              <p className="text-xs mt-0.5 opacity-80">
                Fits your party of {totalGuests}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
