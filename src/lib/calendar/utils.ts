import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns'
import { getMemorialDay, getLaborDay } from '@/lib/booking/seasons'
import type { BookingType, BookingStatus, UserRole } from '@/lib/supabase/types'

export interface CalendarBooking {
  id: string
  userId: string
  userName: string
  startDate: string
  endDate: string
  bookingType: BookingType
  status: BookingStatus
  roomsRequested: string[]
  guestCount: number
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isPeakSeason: boolean
  isToday: boolean
  bookings: CalendarBooking[]
}

export function buildCalendarGrid(year: number, month: number, bookings: CalendarBooking[]): CalendarDay[] {
  const today = new Date()
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const memorialDay = getMemorialDay(year)
  const laborDay = getLaborDay(year)

  const peakInterval = { start: memorialDay, end: laborDay }

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map(date => {
    const dayBookings = bookings.filter(b => {
      const start = parseISO(b.startDate)
      const end = parseISO(b.endDate)
      return isWithinInterval(date, { start, end })
    })

    return {
      date,
      isCurrentMonth: isSameMonth(date, monthStart),
      isPeakSeason: isWithinInterval(date, peakInterval),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      bookings: dayBookings,
    }
  })
}

export const BOOKING_TYPE_STYLES: Record<BookingType, { bg: string; text: string; label: string }> = {
  exclusive_offseason: { bg: 'bg-amber-100 border-amber-400',  text: 'text-amber-800', label: 'Exclusive' },
  exclusive_peak:      { bg: 'bg-blue-100 border-blue-400',    text: 'text-blue-800',  label: 'Exclusive' },
  open_shared:         { bg: 'bg-green-100 border-green-400',  text: 'text-green-800', label: 'Open' },
  lastminute_guest:    { bg: 'bg-purple-100 border-purple-400', text: 'text-purple-800', label: 'Last Min' },
}

export const STATUS_OPACITY: Record<BookingStatus, string> = {
  draft:     'opacity-40',
  pending:   'opacity-70',
  confirmed: 'opacity-100',
  bumped:    'opacity-30 line-through',
  cancelled: 'opacity-20 line-through',
}

export function canSeeRoomDetail(role: UserRole): boolean {
  return role === 'admin' || role === 'papa' || role === 'principal' || role === 'cousin'
}
