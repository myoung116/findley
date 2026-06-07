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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Identity */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{userName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{familyBranch}</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        <StatCell label="Total nights" value={totalNights} />
        <StatCell label="Total visits" value={totalVisits} />
        <StatCell label="Nights (12 mo)" value={ttmNights} />
        <StatCell label="Visits (12 mo)" value={ttmVisits} />
      </div>

      {/* Waiver score */}
      {showWaiver && waiverScore !== null && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Waiver score</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100">{waiverScore.toFixed(1)}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">lower = higher priority</span>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Upcoming</p>
        {upcomingBookings.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming stays.</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map(b => <BookingRow key={b.id} booking={b} />)}
          </div>
        )}
      </div>

      {/* Past */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Past Stays</p>
        {pastBookings.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No past stays yet.</p>
        ) : (
          <div className="space-y-2">
            {pastBookings.map(b => <BookingRow key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function BookingRow({ booking }: { booking: DashboardBooking }) {
  const style = BOOKING_TYPE_STYLES[booking.bookingType]
  const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.draft
  return (
    <div className="py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
        {format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d')}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${style.bg} ${style.text}`}>{style.label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>{booking.status}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{booking.nights}n</span>
      </div>
    </div>
  )
}
