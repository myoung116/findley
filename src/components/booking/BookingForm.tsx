'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingTypeStep } from './BookingTypeStep'
import { DateStep } from './DateStep'
import { RoomStep } from './RoomStep'
import { GuestStep } from './GuestStep'
import { submitBooking } from '@/app/actions/submitBooking'
import { BOOKING_TYPE_LABELS } from '@/lib/booking/dates'
import { ThemeToggle } from '@/components/ThemeToggle'
import { format, parseISO } from 'date-fns'
import type { BookingType } from '@/lib/supabase/types'

type Step = 'type' | 'dates' | 'rooms' | 'guests' | 'confirm'

const STEPS: Step[] = ['type', 'dates', 'rooms', 'guests', 'confirm']

interface Guest { name: string; relationship: string }

export function BookingForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('type')
  const [bookingType, setBookingType] = useState<BookingType | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestCount, setGuestCount] = useState(0)
  const [acknowledged, setAcknowledged] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)

  function toggleRoom(roomId: string) {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    )
  }

  function canAdvance(): boolean {
    switch (step) {
      case 'type': return bookingType !== null
      case 'dates': return !!startDate && !!endDate && startDate < endDate
      case 'rooms': return selectedRoomIds.length > 0
      case 'guests': return acknowledged
      case 'confirm': return true
    }
  }

  function advance() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function back() {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  async function handleSubmit() {
    if (!bookingType) return
    setSubmitting(true)
    setError(null)

    const result = await submitBooking({
      bookingType,
      startDate,
      endDate,
      roomIds: selectedRoomIds,
      guestCount,
      guests,
      notes,
      acknowledgedResponsibility: acknowledged,
    })

    if (result.success) {
      router.push('/?submitted=1')
    } else {
      setError(result.error ?? 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">←</a>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Request a Stay</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Step {stepIndex + 1} of {STEPS.length}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1 bg-blue-500 transition-all"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'type' && (
          <BookingTypeStep value={bookingType} onChange={t => { setBookingType(t); advance() }} />
        )}

        {step === 'dates' && bookingType && (
          <DateStep
            bookingType={bookingType}
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        )}

        {step === 'rooms' && (
          <RoomStep
            startDate={startDate}
            endDate={endDate}
            selectedRoomIds={selectedRoomIds}
            onToggleRoom={toggleRoom}
          />
        )}

        {step === 'guests' && (
          <GuestStep
            guests={guests}
            guestCount={guestCount}
            acknowledged={acknowledged}
            onGuestsChange={setGuests}
            onGuestCountChange={setGuestCount}
            onAcknowledgeChange={setAcknowledged}
          />
        )}

        {step === 'confirm' && bookingType && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Review your request</h2>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Type</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{BOOKING_TYPE_LABELS[bookingType]}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Dates</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {format(parseISO(startDate), 'MMM d')} – {format(parseISO(endDate), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Rooms</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{selectedRoomIds.length} selected</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Guests</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{guests.length}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything the family should know about this visit…"
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          )}

          {step !== 'type' && step !== 'confirm' && (
            <button
              type="button"
              onClick={advance}
              disabled={!canAdvance()}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Continue
            </button>
          )}

          {step === 'confirm' && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
