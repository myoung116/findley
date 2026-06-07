'use client'

import { format, parseISO } from 'date-fns'
import { BOOKING_TYPE_STYLES } from '@/lib/calendar/utils'
import type { DashboardStats, DashboardBooking } from '@/app/page'

interface Props {
  userName: string
  familyBranch: string
  stats: DashboardStats
  showWaiver: boolean
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
  pending:   'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
  draft:     'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400',
}

export function FamilyDashboard({ userName, familyBranch, stats, showWaiver }: Props) {
  const { totalNights, totalVisits, ttmNights, ttmVisits, waiverScore, upcomingBookings, pastBookings } = stats

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm mt-4 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{userName}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{familyBranch}</p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">Your stats</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        <StatCard label="Total nights" value={totalNights} />
        <StatCard label="Total visits" value={totalVisits} />
        <StatCard label="Nights (12 mo)" value={ttmNights} />
        <StatCard label="Visits (12 mo)" value={ttmVisits} />
      </div>

      {showWaiver && waiverScore !== null && (
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Waiver score</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {waiverScore.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">lower = higher priority</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Upcoming */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Upcoming Stays</p>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No upcoming stays.</p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map(b => <BookingRow key={b.id} booking={b} />)}
            </div>
          )}
        </div>

        {/* Past */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Past Stays</p>
          {pastBookings.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No past stays yet.</p>
          ) : (
            <div className="space-y-2">
              {pastBookings.map(b => <BookingRow key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4 text-center">
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function BookingRow({ booking }: { booking: DashboardBooking }) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.draft
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          {format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d, yyyy')}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full border mt-0.5 inline-block ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-xs text-slate-500 dark:text-slate-400">{booking.nights}n · {booking.guestCount} guests</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>
          {booking.status}
        </span>
      </div>
    </div>
  )
}
