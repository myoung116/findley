'use client'

import { useState } from 'react'
import { BOOKING_TYPE_STYLES, STATUS_OPACITY, type CalendarBooking } from '@/lib/calendar/utils'

interface Props {
  booking: CalendarBooking
  onClick?: (booking: CalendarBooking) => void
}

// Larger avatar shown on bookings that include Calvin. Hides itself if the
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
      className="block w-10 h-10 rounded-full object-cover ring-1 ring-white dark:ring-slate-900 shadow-sm"
    />
  )
}

export function BookingPill({ booking, onClick }: Props) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const opacity = STATUS_OPACITY[booking.status]
  const hasCalvin = booking.memberNames.some(n => n.toLowerCase().includes('calvin'))
  const label = `${booking.userName} · ${style.label}`

  // Calvin's stays show his face; everyone else is a small colour block.
  return (
    <button
      onClick={() => onClick?.(booking)}
      title={label}
      aria-label={label}
      className={`shrink-0 hover:brightness-95 transition-all ${opacity}`}
    >
      {hasCalvin
        ? <CalvinAvatar />
        : <span className={`block w-4 h-4 rounded-sm ${style.solid}`} />}
    </button>
  )
}
