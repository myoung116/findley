'use client'

import { useState } from 'react'
import { BOOKING_TYPE_STYLES, STATUS_OPACITY, type CalendarBooking } from '@/lib/calendar/utils'

interface Props {
  booking: CalendarBooking
  onClick?: (booking: CalendarBooking) => void
}

// Small avatar shown on bookings that include Calvin. Hides itself if the
// image file isn't present so a missing asset never breaks the calendar.
function CalvinAvatar() {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/calvin.webp"
      alt="Calvin"
      title="Calvin is staying"
      onError={() => setOk(false)}
      className="inline-block w-4 h-4 rounded-full object-cover mr-1 align-middle ring-1 ring-white/70 dark:ring-slate-900/70"
    />
  )
}

export function BookingPill({ booking, onClick }: Props) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const opacity = STATUS_OPACITY[booking.status]
  const hasCalvin = booking.memberNames.some(n => n.toLowerCase().includes('calvin'))

  return (
    <button
      onClick={() => onClick?.(booking)}
      className={`
        w-full text-left text-[10px] leading-tight px-1 py-px rounded border truncate font-medium
        ${style.bg} ${style.text} ${opacity}
        hover:brightness-95 transition-all
      `}
    >
      {hasCalvin && <CalvinAvatar />}
      {booking.userName}
      <span className="ml-1 opacity-60 font-normal">{style.label}</span>
    </button>
  )
}
