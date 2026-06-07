'use client'

import { useState, useRef } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { buildCalendarGrid, type CalendarBooking } from '@/lib/calendar/utils'
import { DayCell } from './DayCell'
import { BookingDetailModal } from './BookingDetailModal'
import { DayDetailPanel } from './DayDetailPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { UserRole } from '@/lib/supabase/types'

interface Room {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
}

interface Props {
  bookings: CalendarBooking[]
  rooms: Room[]
  role: UserRole
  userName: string
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarClient({ bookings, rooms, role, userName }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function handleDayClick(date: Date) {
    setSelectedDay(prev => prev?.toDateString() === date.toDateString() ? null : date)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  const showRoomDetail = role === 'papa' || role === 'principal'
  const year = current.getFullYear()
  const month = current.getMonth()
  const days = buildCalendarGrid(year, month, bookings)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Findley Lake</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Welcome, {userName}</p>
        </div>
        <div className="flex items-center gap-2">
          {showRoomDetail && (
            <a
              href="/book"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Request
            </a>
          )}
          {role !== 'viewer' && (
            <a href="/admin" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Admin
            </a>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Calendar nav */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrent(d => subMonths(d, 1))}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-lg"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {format(current, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrent(d => addMonths(d, 1))}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-lg"
          >
            ›
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-sky-100 dark:bg-sky-900 border border-sky-300 dark:border-sky-700 inline-block" />
            Peak season
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 inline-block" />
            Exclusive (peak)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900 border border-amber-400 dark:border-amber-600 inline-block" />
            Exclusive (off-season)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 inline-block" />
            Open/shared
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-purple-100 dark:bg-purple-900 border border-purple-400 dark:border-purple-600 inline-block" />
            Last-minute guest
          </span>
        </div>

        {/* Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => (
              <DayCell
                key={i}
                day={day}
                showRoomDetail={showRoomDetail}
                onBookingClick={setSelectedBooking}
                onDayClick={handleDayClick}
                selected={selectedDay?.toDateString() === day.date.toDateString()}
              />
            ))}
          </div>
        </div>

        {!showRoomDetail && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
            Showing confirmed bookings only
          </p>
        )}

        <div ref={panelRef}>
          {selectedDay && (
            <DayDetailPanel
              date={selectedDay}
              bookings={bookings}
              rooms={rooms}
              showRoomDetail={showRoomDetail}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </div>
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        rooms={rooms}
        showRoomDetail={showRoomDetail}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  )
}
