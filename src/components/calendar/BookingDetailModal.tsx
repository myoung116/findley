'use client'

import { format, parseISO } from 'date-fns'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import type { CalendarBooking } from '@/lib/calendar/utils'

interface Room {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
}

interface Props {
  booking: CalendarBooking | null
  rooms: Room[]
  showRoomDetail: boolean
  onClose: () => void
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  bumped: 'Bumped',
  cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  draft: 'text-slate-500 bg-slate-100',
  pending: 'text-yellow-700 bg-yellow-100',
  confirmed: 'text-green-700 bg-green-100',
  bumped: 'text-red-700 bg-red-100',
  cancelled: 'text-slate-400 bg-slate-100',
}

export function BookingDetailModal({ booking, rooms, showRoomDetail, onClose }: Props) {
  if (!booking) return null

  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const bookedRooms = showRoomDetail
    ? rooms.filter(r => booking.roomsRequested.includes(r.id))
    : []

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">{booking.userName}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.text} mt-1 inline-block`}>
              {style.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Dates</span>
            <span>
              {format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[booking.status]}`}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Guests</span>
            <span>{booking.guestCount}</span>
          </div>

          {showRoomDetail && bookedRooms.length > 0 && (
            <div>
              <span className="text-slate-400 block mb-1">Rooms</span>
              <div className="space-y-1">
                {bookedRooms.map(room => (
                  <div key={room.id} className="bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="font-medium">{room.name}</span>
                    <span className="text-slate-400 ml-2">{room.max_occupancy} max</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
