'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { cancelBooking } from '@/app/actions/cancelBooking'
import { EditBookingForm } from './EditBookingForm'
import { BOOKING_TYPE_LABELS } from '@/lib/booking/dates'
import type { BookingType, BookingStatus } from '@/lib/supabase/types'

export interface ManageableBooking {
  id: string
  startDate: string
  endDate: string
  bookingType: BookingType
  status: BookingStatus
  guestCount: number
  notes?: string
}

interface Props {
  booking: ManageableBooking
  onClose: () => void
}

export function ManageBookingModal({ booking, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'edit' | 'cancel'>('edit')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setConfirming(true)
    setError(null)
    const result = await cancelBooking(booking.id)
    if (result.success) { router.refresh(); onClose() }
    else { setError(result.error ?? 'Failed to cancel'); setConfirming(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Manage Booking</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {format(parseISO(booking.startDate), 'MMM d')} – {format(parseISO(booking.endDate), 'MMM d, yyyy')} · {BOOKING_TYPE_LABELS[booking.bookingType]}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none mt-0.5">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {(['edit', 'cancel'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'cancel' ? 'Cancel Stay' : 'Edit Details'}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {tab === 'edit' && (
            <EditBookingForm bookingId={booking.id} bookingType={booking.bookingType} onSaved={onClose} />
          )}

          {tab === 'cancel' && (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                This will cancel your stay from{' '}
                <strong>{format(parseISO(booking.startDate), 'MMM d')}</strong> to{' '}
                <strong>{format(parseISO(booking.endDate), 'MMM d, yyyy')}</strong>.
                This cannot be undone.
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                onClick={handleCancel}
                disabled={confirming}
                className="w-full bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {confirming ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
              <button onClick={onClose} className="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Keep Booking
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
