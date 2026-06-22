'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateStep } from './DateStep'
import { RoomStep } from './RoomStep'
import { GuestStep } from './GuestStep'
import { getBookingDetail } from '@/app/actions/getBookingDetail'
import { updateBooking } from '@/app/actions/updateBooking'
import type { BookingType } from '@/lib/supabase/types'
import type { RosterMember } from '@/app/actions/getBranchRoster'

interface Guest { name: string; relationship: string; isChild?: boolean }

interface Props {
  bookingId: string
  bookingType: BookingType
  onSaved: () => void
}

export function EditBookingForm({ bookingId, bookingType, onSaved }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [extraAdults, setExtraAdults] = useState(0)
  const [extraKids, setExtraKids] = useState(0)
  const [guests, setGuests] = useState<Guest[]>([])
  const [notes, setNotes] = useState('')

  const [, setRoomCapacity] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getBookingDetail(bookingId).then(res => {
      if (!active) return
      if (res.error || !res.detail) { setLoadError(res.error ?? 'Could not load booking.'); setLoading(false); return }
      const d = res.detail
      setStartDate(d.startDate)
      setEndDate(d.endDate)
      setSelectedRoomIds(d.roomIds)
      setRoster(d.roster)
      setSelectedMemberIds(d.memberIds)
      setGuests(d.guests)
      setNotes(d.notes)

      // Reconstruct "additional guests" = stored totals minus the named people.
      const sel = d.roster.filter(m => d.memberIds.includes(m.id))
      const memberAdults = sel.filter(m => !m.isChild).length
      const memberKids = sel.filter(m => m.isChild).length
      const guestAdults = d.guests.filter(g => !g.isChild).length
      const guestKids = d.guests.filter(g => g.isChild).length
      setExtraAdults(Math.max(0, d.adultCount - memberAdults - guestAdults))
      setExtraKids(Math.max(0, d.kidCount - memberKids - guestKids))
      setLoading(false)
    })
    return () => { active = false }
  }, [bookingId])

  function toggleRoom(id: string) {
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }
  function toggleMember(id: string) {
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  const selectedMembers = roster.filter(m => selectedMemberIds.includes(m.id))
  const totalAdults = selectedMembers.filter(m => !m.isChild).length + extraAdults + guests.filter(g => !g.isChild).length
  const totalKids = selectedMembers.filter(m => m.isChild).length + extraKids + guests.filter(g => g.isChild).length
  const totalParty = totalAdults + totalKids

  async function save() {
    setSaving(true)
    setError(null)
    if (selectedRoomIds.length === 0) { setError('Select at least one room.'); setSaving(false); return }
    if (totalParty < 1) { setError('Add at least one person.'); setSaving(false); return }

    const res = await updateBooking(bookingId, {
      notes,
      startDate, endDate,
      roomIds: selectedRoomIds,
      adultCount: totalAdults,
      kidCount: totalKids,
      guestCount: totalParty,
      memberIds: selectedMemberIds,
      guests,
    })
    if (res.success) { router.refresh(); onSaved() }
    else { setError(res.error ?? 'Could not save.'); setSaving(false) }
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">Loading…</p>
  if (loadError) return <p className="text-sm text-red-600 dark:text-red-400 py-4">{loadError}</p>

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Dates</h3>
        <DateStep
          bookingType={bookingType}
          startDate={startDate} endDate={endDate}
          onStartChange={setStartDate} onEndChange={setEndDate}
        />
      </section>

      <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <GuestStep
          roster={roster}
          selectedMemberIds={selectedMemberIds}
          extraAdults={extraAdults} extraKids={extraKids}
          guests={guests} acknowledged={true}
          onToggleMember={toggleMember}
          onExtraAdultsChange={setExtraAdults} onExtraKidsChange={setExtraKids}
          onGuestsChange={setGuests}
          onAcknowledgeChange={() => {}}
        />
      </section>

      <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <RoomStep
          startDate={startDate} endDate={endDate}
          selectedRoomIds={selectedRoomIds}
          totalGuests={totalParty}
          excludeBookingId={bookingId}
          onToggleRoom={toggleRoom}
          onCapacityChange={setRoomCapacity}
        />
      </section>

      <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Anything the family should know…"
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
