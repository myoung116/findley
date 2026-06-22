'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { approveBooking } from '@/app/actions/approveBooking'
import { rejectBooking } from '@/app/actions/rejectBooking'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import type { BookingType } from '@/lib/supabase/types'

export interface PendingCousinBooking {
  id: string
  cousinName: string
  startDate: string
  endDate: string
  bookingType: BookingType
  roomsRequested: string[]
  guestCount: number
  notes: string | null
}

interface Room { id: string; name: string; max_occupancy: number }

export function BranchPendingQueue({ bookings, rooms }: { bookings: PendingCousinBooking[]; rooms: Room[] }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm text-slate-400 dark:text-slate-500">
        No cousin bookings waiting on approval.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {bookings.map(b => <PendingCard key={b.id} booking={b} rooms={rooms} />)}
    </div>
  )
}

function PendingCard({ booking, rooms }: { booking: PendingCousinBooking; rooms: Room[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingRooms, setEditingRooms] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<string[]>(booking.roomsRequested)

  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const roomName = (id: string) => rooms.find(r => r.id === id)?.name ?? 'Unknown room'

  function toggleRoom(id: string) {
    setSelectedRooms(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const roomsChanged =
    selectedRooms.length !== booking.roomsRequested.length ||
    selectedRooms.some(r => !booking.roomsRequested.includes(r))

  function approve() {
    setError(null)
    if (selectedRooms.length === 0) { setError('Select at least one room.'); return }
    startTransition(async () => {
      const res = await approveBooking(booking.id, roomsChanged ? { roomIds: selectedRooms } : {})
      if (res.success) router.refresh()
      else setError(res.error ?? 'Could not approve.')
    })
  }

  function reject() {
    setError(null)
    startTransition(async () => {
      const res = await rejectBooking(booking.id)
      if (res.success) router.refresh()
      else setError(res.error ?? 'Could not reject.')
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800 dark:text-slate-100">{booking.cousinName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${style.bg} ${style.text}`}>{style.label}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d, yyyy')} · {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
          </p>
          {booking.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">“{booking.notes}”</p>}
        </div>
      </div>

      {/* Rooms */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {editingRooms ? 'Override rooms' : 'Requested rooms'}
          </span>
          <button
            type="button"
            onClick={() => setEditingRooms(e => !e)}
            className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400"
          >
            {editingRooms ? 'Done' : 'Change'}
          </button>
        </div>

        {!editingRooms ? (
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
            {selectedRooms.map(roomName).join(', ') || '—'}
            {roomsChanged && <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">(overridden)</span>}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rooms.map(r => {
              const on = selectedRooms.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRoom(r.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    on
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {r.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={approve}
          disabled={pending}
          className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {roomsChanged ? 'Approve with changes' : 'Approve'}
        </button>
        <button
          onClick={reject}
          disabled={pending}
          className="text-sm bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
