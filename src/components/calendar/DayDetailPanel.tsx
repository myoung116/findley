'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { isPeakSeason } from '@/lib/booking/seasons'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import { ManageBookingModal, type ManageableBooking } from '@/components/booking/ManageBookingModal'
import type { CalendarBooking } from '@/lib/calendar/utils'

export interface RoomAttributes {
  floor?: number
  bathroom?: string
  beds?: string[]
  notes?: string
}

interface Room { id: string; name: string; bed_count: number; max_occupancy: number; flex_capacity?: number; attributes?: RoomAttributes | null }

interface Props {
  date: Date
  bookings: CalendarBooking[]
  rooms: Room[]
  showRoomDetail: boolean
  canManageAll?: boolean
  onClose: () => void
  onRequestStay?: (date: Date) => void
}

export function DayDetailPanel({ date, bookings, rooms, showRoomDetail, canManageAll, onClose, onRequestStay }: Props) {
  const [managing, setManaging] = useState<ManageableBooking | null>(null)
  const dayBookings = bookings.filter(b => {
    const start = parseISO(b.startDate)
    const end = parseISO(b.endDate)
    return date >= start && date < end
  })

  const peak = isPeakSeason(date)
  const totalGuests = dayBookings.reduce((sum, b) => sum + b.guestCount, 0)
  const totalAdults = dayBookings.reduce((sum, b) => sum + b.adultCount, 0)
  const totalKids = dayBookings.reduce((sum, b) => sum + b.kidCount, 0)

  // Build roomId → guest count map from all bookings on this day
  // Note: once bed optimizer is complete, replace guestCount with per-room
  // assigned counts from sleep_assignments so each room shows exact occupancy.
  const roomGuests = new Map<string, number>()
  for (const b of dayBookings) {
    for (const roomId of b.roomsRequested) {
      roomGuests.set(roomId, (roomGuests.get(roomId) ?? 0) + b.guestCount)
    }
  }

  const occupiedRoomIds = new Set(dayBookings.flatMap(b => b.roomsRequested))
  const openRooms = rooms.filter(r => !occupiedRoomIds.has(r.id))

  const confirmed = dayBookings.filter(b => b.status === 'confirmed')
  const interested = dayBookings.filter(b => b.status === 'pending' || b.status === 'draft')

  // Group bookings by family branch so members of the same branch show together.
  function groupByBranch(list: CalendarBooking[]): [string, CalendarBooking[]][] {
    const groups = new Map<string, CalendarBooking[]>()
    for (const b of list) {
      const key = b.familyBranch || 'Other'
      const arr = groups.get(key) ?? []
      arr.push(b)
      groups.set(key, arr)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }

  return (
    <>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm mt-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {format(date, 'EEEE, MMMM d')}
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            peak
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {peak ? 'Peak season' : 'Off-season'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none p-1"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

        {/* Families */}
        <div className="md:col-span-2 px-5 py-4">
          {dayBookings.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No bookings on this day.</p>
          ) : (
            <div className="space-y-4">
              {confirmed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Booked</p>
                  <div className="space-y-3">
                    {groupByBranch(confirmed).map(([branch, list]) => (
                      <div key={branch}>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">{branch}</p>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                          {list.map(b => <FamilyRow key={b.id} booking={b} rooms={rooms} showRooms={showRoomDetail} canManage={canManageAll} onManage={setManaging} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {interested.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Interested / Pending</p>
                  <div className="space-y-3">
                    {groupByBranch(interested).map(([branch, list]) => (
                      <div key={branch}>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">{branch}</p>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                          {list.map(b => <FamilyRow key={b.id} booking={b} rooms={rooms} showRooms={showRoomDetail} canManage={canManageAll} onManage={setManaging} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Occupancy summary */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Occupancy</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total guests</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{totalGuests}</span>
              </div>
              {totalGuests > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">Adults / kids</span>
                  <span className="text-slate-500 dark:text-slate-400">{totalAdults} adult{totalAdults === 1 ? '' : 's'} · {totalKids} kid{totalKids === 1 ? '' : 's'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rooms occupied</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{occupiedRoomIds.size} of {rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rooms open</span>
                <span className={`font-medium ${openRooms.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {openRooms.length}
                </span>
              </div>
            </div>
          </div>

          {showRoomDetail && rooms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Rooms</p>
              <div className="space-y-1">
                {rooms.map(room => (
                <RoomRow
                  key={room.id}
                  room={room}
                  guests={roomGuests.get(room.id) ?? 0}
                />
              ))}
              </div>
            </div>
          )}

          {onRequestStay && (
            <button
              onClick={() => onRequestStay(date)}
              className="w-full text-sm bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 transition-colors font-medium"
            >
              + Request a Stay
            </button>
          )}

          <button
            disabled
            title="Available after Step 9"
            className="w-full text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 rounded-xl py-2 cursor-not-allowed"
          >
            Run Optimizer
          </button>
        </div>
      </div>
    </div>
    {managing && <ManageBookingModal booking={managing} onClose={() => setManaging(null)} />}
    </>
  )
}

function RoomRow({ room, guests }: { room: Room; guests: number }) {
  const [expanded, setExpanded] = useState(false)
  const attrs = room.attributes ?? {}
  const beds = attrs.beds ?? []
  const flex = room.flex_capacity ?? 0
  // Capacity for occupancy = real beds + flex sleeping (pack/play, air mattress,
  // couch), so a kid on a flex spot doesn't read as over-full.
  const capacity = room.max_occupancy + flex
  const fillPct = capacity > 0 ? Math.min(100, Math.round((guests / capacity) * 100)) : 0
  const occupied = guests > 0

  // Colour scheme: empty=green, partial=green, getting full=amber, full/over=red
  const scheme = !occupied
    ? { wrap: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', bar: 'bg-green-400 dark:bg-green-500', label: 'Open' }
    : fillPct >= 90
    ? { wrap: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',   bar: 'bg-red-400 dark:bg-red-500',   label: `${guests}/${capacity}` }
    : fillPct >= 60
    ? { wrap: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', bar: 'bg-amber-400 dark:bg-amber-500', label: `${guests}/${capacity}` }
    : { wrap: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', bar: 'bg-green-400 dark:bg-green-500', label: `${guests}/${capacity}` }

  const bedCounts: Record<string, number> = {}
  for (const bed of beds) bedCounts[bed] = (bedCounts[bed] ?? 0) + 1
  const bedSummary = Object.entries(bedCounts)
    .map(([type, count]) => `${count > 1 ? `${count}x ` : ''}${type.charAt(0).toUpperCase() + type.slice(1)}`)
    .join(', ')

  return (
    <div className={`rounded-lg text-xs overflow-hidden ${scheme.wrap}`}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="font-medium">{room.name}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{scheme.label}</span>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="opacity-60 hover:opacity-100 transition-opacity"
            title="Room details"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Occupancy fill bar */}
      {occupied && (
        <div className="h-1 w-full bg-current bg-opacity-10">
          <div
            className={`h-1 transition-all ${scheme.bar}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      )}

      {expanded && (
        <div className="px-2 pb-2 pt-1.5 space-y-0.5 border-t border-current border-opacity-10">
          {occupied && (
            <p className="opacity-80">
              <span className="opacity-60">Guests: </span>
              {guests} of {capacity} sleeping spots used
              {/* TODO: replace with per-bed assignments once optimizer is complete */}
            </p>
          )}
          {bedSummary && (
            <p className="opacity-80"><span className="opacity-60">Beds: </span>{bedSummary}</p>
          )}
          {flex > 0 && (
            <p className="opacity-80"><span className="opacity-60">Flex sleeping: </span>{flex} (pack/play, air mattress, couch)</p>
          )}
          {attrs.bathroom && (
            <p className="opacity-80"><span className="opacity-60">Bathroom: </span>{attrs.bathroom === 'private' ? 'Attached private' : 'Shared'}</p>
          )}
          {attrs.floor !== undefined && (
            <p className="opacity-80"><span className="opacity-60">Floor: </span>{attrs.floor === 0 ? 'Garage' : `Floor ${attrs.floor}`}</p>
          )}
          {attrs.notes && (
            <p className="opacity-60 italic">{attrs.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

function FamilyRow({ booking, rooms, showRooms, canManage, onManage }: {
  booking: CalendarBooking
  rooms: Room[]
  showRooms: boolean
  canManage?: boolean
  onManage?: (b: ManageableBooking) => void
}) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const bookedRooms = showRooms ? rooms.filter(r => booking.roomsRequested.includes(r.id)) : []

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-800 dark:text-slate-100">{booking.userName}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${style.bg} ${style.text}`}>{style.label}</span>
        </div>
        {booking.memberNames.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="text-slate-400 dark:text-slate-500">With: </span>
            {booking.memberNames.join(', ')}
          </p>
        )}
        {showRooms && bookedRooms.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {bookedRooms.map(r => r.name).join(', ')}
          </p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
          {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
          {booking.kidCount > 0 && (
            <span className="block font-normal text-slate-400 dark:text-slate-500">{booking.adultCount} adult{booking.adultCount === 1 ? '' : 's'} · {booking.kidCount} kid{booking.kidCount === 1 ? '' : 's'}</span>
          )}
        </span>
        {canManage && onManage && (
          <button
            onClick={() => onManage({ id: booking.id, startDate: booking.startDate, endDate: booking.endDate, bookingType: booking.bookingType, status: booking.status, guestCount: booking.guestCount })}
            className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage
          </button>
        )}
      </div>
    </div>
  )
}
