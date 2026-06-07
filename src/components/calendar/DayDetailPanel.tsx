'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { isPeakSeason } from '@/lib/booking/seasons'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import { ManageBookingModal, type ManageableBooking } from '@/components/booking/ManageBookingModal'
import type { CalendarBooking } from '@/lib/calendar/utils'

interface Room { id: string; name: string; bed_count: number; max_occupancy: number }

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
  const occupiedRoomIds = new Set(dayBookings.flatMap(b => b.roomsRequested))
  const openRooms = rooms.filter(r => !occupiedRoomIds.has(r.id))
  const totalGuests = dayBookings.reduce((sum, b) => sum + b.guestCount, 0)

  const confirmed = dayBookings.filter(b => b.status === 'confirmed')
  const interested = dayBookings.filter(b => b.status === 'pending' || b.status === 'draft')

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
                  <div className="space-y-2">
                    {confirmed.map(b => <FamilyRow key={b.id} booking={b} rooms={rooms} showRooms={showRoomDetail} canManage={canManageAll} onManage={setManaging} />)}
                  </div>
                </div>
              )}
              {interested.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Interested / Pending</p>
                  <div className="space-y-2">
                    {interested.map(b => <FamilyRow key={b.id} booking={b} rooms={rooms} showRooms={showRoomDetail} canManage={canManageAll} onManage={setManaging} />)}
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
                {rooms.map(room => {
                  const taken = occupiedRoomIds.has(room.id)
                  return (
                    <div key={room.id} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${
                      taken
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    }`}>
                      <span className="font-medium">{room.name}</span>
                      <span className="opacity-70">{taken ? 'Occupied' : 'Open'}</span>
                    </div>
                  )
                })}
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
        {showRooms && bookedRooms.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {bookedRooms.map(r => r.name).join(', ')}
          </p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{booking.guestCount} guests</span>
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
