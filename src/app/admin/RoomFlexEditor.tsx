'use client'

import { useState, useTransition } from 'react'
import { updateRoomFlex } from '@/app/actions/updateRoomFlex'

export interface RoomFlexRow {
  id: string
  name: string
  bed_count: number
  max_occupancy: number
  flex_capacity: number
}

export function RoomFlexEditor({ rooms }: { rooms: RoomFlexRow[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">Room sleeping capacity</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        Beds are fixed. &ldquo;Flex&rdquo; is extra sleeping spots beyond the beds — pack/play, air mattress, couch.
        These count toward how many people a room can hold without showing as over-full.
      </p>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {rooms.map(room => <RoomFlexRowEditor key={room.id} room={room} />)}
      </div>
    </section>
  )
}

function RoomFlexRowEditor({ room }: { room: RoomFlexRow }) {
  const [flex, setFlex] = useState(room.flex_capacity)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = flex !== room.flex_capacity
  const overMax = flex > 6

  function save() {
    setError(null)
    if (overMax) {
      setError('A room can have at most 6 flex sleeping spots.')
      return
    }
    startTransition(async () => {
      const res = await updateRoomFlex(room.id, flex)
      if (res.success) {
        room.flex_capacity = flex
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(res.error ?? 'Could not save.')
      }
    })
  }

  return (
    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{room.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {room.max_occupancy} bed{room.max_occupancy === 1 ? '' : 's'} · sleeps {room.max_occupancy + flex}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {(error || overMax) && (
          <span className="text-xs text-red-600 dark:text-red-400">{error ?? 'Max 6 flex spots.'}</span>
        )}
        {saved && !overMax && <span className="text-xs text-green-600 dark:text-green-400">Saved ✓</span>}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">flex</span>
          <button
            type="button"
            onClick={() => setFlex(f => Math.max(0, f - 1))}
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{flex}</span>
          <button
            type="button"
            onClick={() => setFlex(f => f + 1)}
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
          >
            +
          </button>
        </div>
        <button
          onClick={save}
          disabled={!dirty || pending || overMax}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
