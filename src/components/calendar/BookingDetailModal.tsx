'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import { approveBooking } from '@/app/actions/approveBooking'
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
  canManageAll?: boolean
  onClose: () => void
}

const STATUS_LABELS = {
  draft: 'Draft', pending: 'Pending', confirmed: 'Confirmed', bumped: 'Bumped', cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  draft:     'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
  pending:   'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
  confirmed: 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
  bumped:    'text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
  cancelled: 'text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-500',
}

export function BookingDetailModal({ booking, rooms, showRoomDetail, canManageAll, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [approveError, setApproveError] = useState<string | null>(null)

  if (!booking) return null

  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const bookedRooms = showRoomDetail ? rooms.filter(r => booking.roomsRequested.includes(r.id)) : []
  const canApprove = canManageAll && booking.status === 'pending'

  function handleApprove() {
    setApproveError(null)
    startTransition(async () => {
      const result = await approveBooking(booking!.id)
      if (result.success) { router.refresh(); onClose() }
      else setApproveError(result.error ?? 'Failed to approve')
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{booking.userName}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400 dark:text-slate-500">Dates</span>
            <span>{format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[booking.status]}`}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 dark:text-slate-500">Guests</span>
            <span>{booking.guestCount}</span>
          </div>

          {showRoomDetail && bookedRooms.length > 0 && (
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-1">Rooms</span>
              <div className="space-y-1">
                {bookedRooms.map(room => (
                  <div key={room.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs flex justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{room.name}</span>
                    <span className="text-slate-400">{room.max_occupancy} max</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {canApprove && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {approveError && <p className="text-xs text-red-500">{approveError}</p>}
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Approving…' : 'Approve Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
