'use client'

import { useEffect } from 'react'
import { deriveEndDate, getMinStartDate, isValidStartDate } from '@/lib/booking/dates'
import type { BookingType } from '@/lib/supabase/types'

interface Props {
  bookingType: BookingType
  startDate: string
  endDate: string
  adultCount: number
  kidCount: number
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
  onAdultCountChange: (count: number) => void
  onKidCountChange: (count: number) => void
}

const END_DATE_LOCKED: BookingType[] = ['exclusive_offseason', 'exclusive_peak']

function Stepper({ value, min, onChange }: { value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-xl font-medium transition-colors"
      >
        −
      </button>
      <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-xl font-medium transition-colors"
      >
        +
      </button>
    </div>
  )
}

export function DateStep({ bookingType, startDate, endDate, adultCount, kidCount, onStartChange, onEndChange, onAdultCountChange, onKidCountChange }: Props) {
  const endLocked = END_DATE_LOCKED.includes(bookingType)
  const mondayOnly = bookingType === 'exclusive_offseason' || bookingType === 'exclusive_peak'

  useEffect(() => {
    if (endLocked && startDate) {
      const derived = deriveEndDate(bookingType, startDate)
      if (derived) onEndChange(derived)
    }
  }, [bookingType, startDate, endLocked, onEndChange])

  const startInvalid = startDate && mondayOnly && !isValidStartDate(bookingType, startDate)

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select dates</h2>

      {mondayOnly && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          Start date must be a <strong>Monday</strong> for this booking type.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Check-in (4pm)</label>
        <input
          type="date"
          value={startDate}
          min={getMinStartDate()}
          onChange={e => onStartChange(e.target.value)}
          className={`
            w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${startInvalid ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
          `}
        />
        {startInvalid && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">Please select a Monday.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          Checkout (noon)
          {endLocked && <span className="text-slate-400 dark:text-slate-500 ml-1">(auto-set)</span>}
        </label>
        <input
          type="date"
          value={endDate}
          min={startDate || getMinStartDate()}
          onChange={e => !endLocked && onEndChange(e.target.value)}
          disabled={endLocked}
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600"
        />
      </div>

      {bookingType === 'exclusive_peak' && startDate && endDate && (
        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
          Exclusivity ends Friday morning. Weekend access (Fri afternoon – Sun) reverts to open/waiver priority.
        </p>
      )}

      {/* Family member headcount — split adults / kids */}
      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          How many family members attending?
          <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">
            Include yourself. Counting kids helps the family plan meals.
          </span>
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">Adults</span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">Ages 13+</span>
          </div>
          <Stepper value={adultCount} min={1} onChange={onAdultCountChange} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">Kids</span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">Under 13 (incl. pack/play, air mattress)</span>
          </div>
          <Stepper value={kidCount} min={0} onChange={onKidCountChange} />
        </div>
      </div>
    </div>
  )
}
