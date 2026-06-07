'use client'

import { BOOKING_TYPE_LABELS, BOOKING_TYPE_DESCRIPTIONS } from '@/lib/booking/dates'
import type { BookingType } from '@/lib/supabase/types'

const BOOKING_TYPES: BookingType[] = [
  'exclusive_offseason',
  'exclusive_peak',
  'open_shared',
  'lastminute_guest',
]

interface Props {
  value: BookingType | null
  onChange: (type: BookingType) => void
}

export function BookingTypeStep({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-700">Select booking type</h2>
      {BOOKING_TYPES.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`
            w-full text-left p-4 rounded-xl border-2 transition-all
            ${value === type
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}
        >
          <p className="font-medium text-sm text-slate-800">{BOOKING_TYPE_LABELS[type]}</p>
          <p className="text-xs text-slate-500 mt-0.5">{BOOKING_TYPE_DESCRIPTIONS[type]}</p>
        </button>
      ))}
    </div>
  )
}
