'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInDays } from 'date-fns'
import { approveBooking } from '@/app/actions/approveBooking'
import { cancelBooking } from '@/app/actions/cancelBooking'
import { BOOKING_TYPE_LABELS } from '@/lib/booking/dates'
import type { BookingType } from '@/lib/supabase/types'

export interface PendingBookingRow {
  id: string
  start_date: string
  end_date: string
  booking_type: BookingType
  guest_count: number
  notes: string | null
  created_at: string
  users: { name: string; family_branch: string } | null
}

function ActionButtons({ booking }: { booking: PendingBookingRow }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveBooking(booking.id)
      if (result.success) router.refresh()
      else setError(result.error ?? 'Failed to approve')
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await cancelBooking(booking.id)
      if (result.success) router.refresh()
      else setError(result.error ?? 'Failed to reject')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors font-medium"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors font-medium"
        >
          Reject
        </button>
      </div>
      {isPending && <span className="text-xs text-slate-400">Saving...</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export function PendingBookings({ bookings }: { bookings: PendingBookingRow[] }) {
  if (bookings.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Pending Approvals
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
          No pending bookings
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Pending Approvals
        <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
          {bookings.length} waiting
        </span>
      </h2>

      <div className="space-y-3">
        {bookings.map(b => {
          const nights = Math.max(0, differenceInDays(parseISO(b.end_date), parseISO(b.start_date)))
          return (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {b.users?.name ?? 'Unknown'}
                  </p>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {b.users?.family_branch}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {format(parseISO(b.start_date), 'MMM d')}
                  {' – '}
                  {format(parseISO(b.end_date), 'MMM d, yyyy')}
                  <span className="text-slate-400 dark:text-slate-500"> · {nights} night{nights !== 1 ? 's' : ''}</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {BOOKING_TYPE_LABELS[b.booking_type]} · {b.guest_count} guest{b.guest_count !== 1 ? 's' : ''}
                </p>
                {b.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">&ldquo;{b.notes}&rdquo;</p>
                )}
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  Submitted {format(parseISO(b.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <ActionButtons booking={b} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
