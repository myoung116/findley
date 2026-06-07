'use client'

import { BOOKING_TYPE_STYLES, STATUS_OPACITY, type CalendarBooking } from '@/lib/calendar/utils'

interface Props {
  booking: CalendarBooking
  onClick?: (booking: CalendarBooking) => void
}

export function BookingPill({ booking, onClick }: Props) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const opacity = STATUS_OPACITY[booking.status]

  return (
    <button
      onClick={() => onClick?.(booking)}
      className={`
        w-full text-left text-xs px-1.5 py-0.5 rounded border truncate font-medium
        ${style.bg} ${style.text} ${opacity}
        hover:brightness-95 transition-all
      `}
    >
      {booking.userName}
      <span className="ml-1 opacity-60 font-normal">{style.label}</span>
    </button>
  )
}
