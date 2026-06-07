'use client'

import { format } from 'date-fns'
import { BookingPill } from './BookingPill'
import type { CalendarDay, CalendarBooking } from '@/lib/calendar/utils'

interface Props {
  day: CalendarDay
  showRoomDetail?: boolean
  onBookingClick?: (booking: CalendarBooking) => void
  onDayClick?: (date: Date) => void
}

export function DayCell({ day, onBookingClick, onDayClick }: Props) {
  const baseCell = 'min-h-24 p-1 border-b border-r border-slate-100'
  const dimmed = !day.isCurrentMonth ? 'bg-slate-50' : day.isPeakSeason ? 'bg-sky-50' : 'bg-white'

  return (
    <div
      className={`${baseCell} ${dimmed} cursor-pointer hover:bg-slate-100 transition-colors`}
      onClick={() => onDayClick?.(day.date)}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
            ${day.isToday ? 'bg-blue-600 text-white' : day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
          `}
        >
          {format(day.date, 'd')}
        </span>
        {day.isPeakSeason && day.isCurrentMonth && (
          <span className="text-[10px] text-sky-400 font-medium">peak</span>
        )}
      </div>

      <div className="space-y-0.5">
        {day.bookings.slice(0, 3).map(booking => (
          <BookingPill
            key={booking.id}
            booking={booking}
            onClick={() => onBookingClick?.(booking)}
          />
        ))}
        {day.bookings.length > 3 && (
          <p className="text-[10px] text-slate-400 pl-1">+{day.bookings.length - 3} more</p>
        )}
      </div>
    </div>
  )
}
