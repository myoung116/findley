'use client'

import { format } from 'date-fns'
import { BookingPill } from './BookingPill'
import type { CalendarDay, CalendarBooking } from '@/lib/calendar/utils'

interface Props {
  day: CalendarDay
  showRoomDetail?: boolean
  selected?: boolean
  inDragRange?: boolean
  isDragStart?: boolean
  isDragEnd?: boolean
  onBookingClick?: (booking: CalendarBooking) => void
  onDayClick?: (date: Date) => void
  onMouseDown?: (date: Date) => void
  onMouseEnter?: (date: Date) => void
  onMouseUp?: (date: Date) => void
}

export function DayCell({ day, selected, inDragRange, isDragStart, isDragEnd, onBookingClick, onDayClick, onMouseDown, onMouseEnter, onMouseUp }: Props) {
  const base = 'min-h-24 p-1 border-b border-r border-slate-100 dark:border-slate-800 select-none'

  let bg: string
  if (isDragStart || isDragEnd) {
    bg = 'bg-blue-500 dark:bg-blue-600'
  } else if (inDragRange) {
    bg = 'bg-blue-100 dark:bg-blue-900/50'
  } else if (selected) {
    bg = 'bg-blue-50 dark:bg-blue-950/40'
  } else if (!day.isCurrentMonth) {
    bg = 'bg-slate-50 dark:bg-slate-950'
  } else if (day.isPeakSeason) {
    bg = 'bg-sky-50 dark:bg-sky-950/40'
  } else {
    bg = 'bg-white dark:bg-slate-900'
  }

  const dateNumColor = isDragStart || isDragEnd
    ? 'text-white'
    : day.isToday
      ? ''
      : day.isCurrentMonth
        ? 'text-slate-700 dark:text-slate-200'
        : 'text-slate-300 dark:text-slate-600'

  return (
    <div
      className={`${base} ${bg} cursor-pointer hover:brightness-95 transition-colors`}
      onClick={() => { if (!onMouseDown) onDayClick?.(day.date) }}
      onMouseDown={e => { e.preventDefault(); onMouseDown?.(day.date) }}
      onMouseEnter={() => onMouseEnter?.(day.date)}
      onMouseUp={() => onMouseUp?.(day.date)}
    >
      {(() => {
        const totalGuests = day.bookings.reduce((sum, b) => sum + b.guestCount, 0)
        return (
          <div className="flex items-center justify-between mb-1">
            <span
              className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${day.isToday && !(isDragStart || isDragEnd)
                  ? 'bg-blue-600 text-white'
                  : dateNumColor
                }
              `}
            >
              {format(day.date, 'd')}
            </span>
            <div className="flex items-center gap-1">
              {totalGuests > 0 && !(isDragStart || isDragEnd) && (
                <span className="text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500 leading-none">
                  {totalGuests}
                  <span className="font-normal opacity-70"> ppl</span>
                </span>
              )}
              {day.isPeakSeason && day.isCurrentMonth && !(isDragStart || isDragEnd) && (
                <span className="text-[10px] text-sky-500 dark:text-sky-400 font-medium">peak</span>
              )}
            </div>
          </div>
        )
      })()}

      <div className="flex flex-wrap items-center gap-1">
        {day.bookings.slice(0, 8).map(booking => (
          <BookingPill
            key={booking.id}
            booking={booking}
            onClick={() => onBookingClick?.(booking)}
          />
        ))}
        {day.bookings.length > 8 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none self-center">+{day.bookings.length - 8}</span>
        )}
      </div>
    </div>
  )
}
