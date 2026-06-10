'use client'

import { BOOKING_TYPE_LABELS, BOOKING_TYPE_DESCRIPTIONS } from '@/lib/booking/dates'
import type { BookingType } from '@/lib/supabase/types'

const ALL_BOOKING_TYPES: BookingType[] = [
  'exclusive_offseason',
  'exclusive_peak',
  'open_shared',
  'lastminute_guest',
]

const COUSIN_BOOKING_TYPES: BookingType[] = ['open_shared', 'lastminute_guest']

interface Props {
  value: BookingType | null
  onChange: (type: BookingType) => void
  role?: string
}

export function BookingTypeStep({ value, onChange, role }: Props) {
  const bookingTypes = role === 'cousin' ? COUSIN_BOOKING_TYPES : ALL_BOOKING_TYPES
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select booking type</h2>
      {bookingTypes.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`
            w-full text-left p-4 rounded-xl border-2 transition-all
            ${value === type
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-500'
            }
          `}
        >
          <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{BOOKING_TYPE_LABELS[type]}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{BOOKING_TYPE_DESCRIPTIONS[type]}</p>
        </button>
      ))}
    </div>
  )
}
