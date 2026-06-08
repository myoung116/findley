'use client'

import { useState, useRef, useEffect } from 'react'
import { format, addMonths, subMonths, isWithinInterval, min, max } from 'date-fns'
import { buildCalendarGrid, type CalendarBooking } from '@/lib/calendar/utils'
import { DayCell } from './DayCell'
import { BookingDetailModal } from './BookingDetailModal'
import { DayDetailPanel } from './DayDetailPanel'
import { BookingForm } from '@/components/booking/BookingForm'
import { FamilyDashboard } from './FamilyDashboard'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { UserRole } from '@/lib/supabase/types'
import type { DashboardStats } from '@/app/page'
import type { RoomAttributes } from './DayDetailPanel'

interface Room {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
  attributes?: RoomAttributes | null
}

interface Props {
  bookings: CalendarBooking[]
  rooms: Room[]
  role: UserRole
  userName: string
  familyBranch: string
  dashboard: DashboardStats
}

type PanelMode = 'day' | 'booking' | null

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarClient({ bookings, rooms, role, userName, familyBranch, dashboard }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const showRoomDetail = role === 'admin' || role === 'papa' || role === 'principal'
  const year = current.getFullYear()
  const month = current.getMonth()
  const days = buildCalendarGrid(year, month, bookings)

  function scrollToPanel() {
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  function handleDayClick(date: Date) {
    const same = selectedDay?.toDateString() === date.toDateString() && panelMode === 'day'
    if (same) { setPanelMode(null); setSelectedDay(null) }
    else { setSelectedDay(date); setPanelMode('day'); scrollToPanel() }
  }

  const [bookingInitialDate, setBookingInitialDate] = useState<string>('')
  const [bookingInitialEndDate, setBookingInitialEndDate] = useState<string>('')

  // Drag-to-select state
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragHover, setDragHover] = useState<Date | null>(null)
  const isDragging = dragStart !== null

  // Compute the highlighted range
  const dragRange = dragStart && dragHover ? {
    start: min([dragStart, dragHover]),
    end: max([dragStart, dragHover]),
  } : null

  // Cancel drag if mouse is released outside the calendar
  useEffect(() => {
    function handleGlobalMouseUp() { setDragStart(null); setDragHover(null) }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  function handleDayMouseDown(date: Date) {
    if (!showRoomDetail) return
    setDragStart(date)
    setDragHover(date)
  }

  function handleDayMouseEnter(date: Date) {
    if (isDragging) setDragHover(date)
  }

  function handleDayMouseUp(date: Date) {
    if (!isDragging) return
    const start = min([dragStart!, date])
    const end = max([dragStart!, date])
    setDragStart(null)
    setDragHover(null)

    // Same day = single click → open day detail
    if (start.toDateString() === end.toDateString()) {
      handleDayClick(date)
      return
    }

    // Multi-day drag → open booking form with range pre-filled
    setBookingInitialDate(format(start, 'yyyy-MM-dd'))
    setBookingInitialEndDate(format(end, 'yyyy-MM-dd'))
    setPanelMode('booking')
    scrollToPanel()
  }

  function openBookingForm(date?: Date) {
    setBookingInitialDate(date ? format(date, 'yyyy-MM-dd') : '')
    setBookingInitialEndDate('')
    setPanelMode('booking')
    scrollToPanel()
  }
  function closePanel() { setPanelMode(null); setSelectedDay(null) }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Findley Lake</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Welcome, {userName}</p>
        </div>
        <div className="flex items-center gap-2">
          {showRoomDetail && (
            <button onClick={() => openBookingForm()} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              + Request
            </button>
          )}
          {role === 'admin' && (
            <a href="/admin" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Admin
            </a>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex gap-6 px-6 pt-6 pb-10 max-w-screen-2xl mx-auto">

        {/* Left sidebar — family stats */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <FamilyDashboard
            userName={userName}
            familyBranch={familyBranch}
            stats={dashboard}
            showWaiver={role === 'principal' || role === 'papa' || role === 'admin'}
            showExclusive={role === 'principal'}
          />
        </aside>

        {/* Main — calendar + panels */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrent(d => subMonths(d, 1))}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-lg">
              ‹
            </button>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              {format(current, 'MMMM yyyy')}
            </h2>
            <button onClick={() => setCurrent(d => addMonths(d, 1))}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-lg">
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

          {/* Calendar grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const inRange = dragRange
                  ? isWithinInterval(day.date, { start: dragRange.start, end: dragRange.end })
                  : false
                const isStart = dragRange ? day.date.toDateString() === dragRange.start.toDateString() : false
                const isEnd = dragRange ? day.date.toDateString() === dragRange.end.toDateString() : false
                return (
                  <DayCell
                    key={i}
                    day={day}
                    showRoomDetail={showRoomDetail}
                    onBookingClick={setSelectedBooking}
                    onDayClick={handleDayClick}
                    onMouseDown={handleDayMouseDown}
                    onMouseEnter={handleDayMouseEnter}
                    onMouseUp={handleDayMouseUp}
                    selected={selectedDay?.toDateString() === day.date.toDateString() && panelMode === 'day'}
                    inDragRange={inRange && !isStart && !isEnd}
                    isDragStart={isStart}
                    isDragEnd={isEnd}
                  />
                )
              })}
            </div>
          </div>

          {!showRoomDetail && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
              Showing confirmed bookings only
            </p>
          )}

          {/* Below-calendar panels */}
          <div ref={panelRef}>
            {panelMode === 'day' && selectedDay && (
              <DayDetailPanel
                date={selectedDay}
                bookings={bookings}
                rooms={rooms}
                showRoomDetail={showRoomDetail}
                onClose={closePanel}
                canManageAll={role === 'admin' || role === 'papa'}
              onRequestStay={showRoomDetail ? (date) => openBookingForm(date) : undefined}
              />
            )}
            {panelMode === 'booking' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm mt-4 overflow-hidden">
                <BookingForm inline onClose={closePanel} initialStartDate={bookingInitialDate} initialEndDate={bookingInitialEndDate} />
              </div>
            )}
          </div>

          {/* Mobile: dashboard below calendar */}
          <div className="lg:hidden mt-4">
            <FamilyDashboard
              userName={userName}
              familyBranch={familyBranch}
              stats={dashboard}
              showWaiver={role === 'principal' || role === 'papa' || role === 'admin'}
            />
          </div>
        </div>
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        rooms={rooms}
        showRoomDetail={showRoomDetail}
        canManageAll={role === 'admin' || role === 'papa'}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  )
}
