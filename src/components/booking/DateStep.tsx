'use client'

import { useEffect } from 'react'
import { deriveEndDate, getMinStartDate, isValidStartDate } from '@/lib/booking/dates'
import type { BookingType } from '@/lib/supabase/types'

interface Props {
  bookingType: BookingType
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
}

const END_DATE_LOCKED: BookingType[] = ['exclusive_offseason', 'exclusive_peak']

export function DateStep({ bookingType, startDate, endDate, onStartChange, onEndChange }: Props) {
  const endLocked = END_DATE_LOCKED.includes(bookingType)
  const mondayOnly = bookingType === 'exclusive_offseason' || bookingType === 'exclusive_peak'

  // Auto-derive end date for locked types
  useEffect(() => {
    if (endLocked && startDate) {
      const derived = deriveEndDate(bookingType, startDate)
      if (derived) onEndChange(derived)
    }
  }, [bookingType, startDate, endLocked, onEndChange])

  const startInvalid = startDate && mondayOnly && !isValidStartDate(bookingType, startDate)

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700">Select dates</h2>

      {mondayOnly && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Start date must be a <strong>Monday</strong> for this booking type.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Check-in (4pm)</label>
        <input
          type="date"
          value={startDate}
          min={getMinStartDate()}
          onChange={e => onStartChange(e.target.value)}
          className={`
            w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${startInvalid ? 'border-red-400' : 'border-slate-300'}
          `}
        />
        {startInvalid && (
          <p className="text-xs text-red-500 mt-1">Please select a Monday.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Checkout (noon)
          {endLocked && <span className="text-slate-400 ml-1">(auto-set)</span>}
        </label>
        <input
          type="date"
          value={endDate}
          min={startDate || getMinStartDate()}
          onChange={e => !endLocked && onEndChange(e.target.value)}
          disabled={endLocked}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {bookingType === 'exclusive_peak' && startDate && endDate && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          Exclusivity ends Friday morning. Weekend access (Fri afternoon – Sun) reverts to open/waiver priority.
        </p>
      )}
    </div>
  )
}
