'use client'

import { useEffect, useState, useTransition } from 'react'
import { getRoomAvailability, type RoomAvailabilityResult } from '@/app/actions/getRoomAvailability'

interface Props {
  startDate: string
  endDate: string
  selectedRoomIds: string[]
  onToggleRoom: (roomId: string) => void
}

export function RoomStep({ startDate, endDate, selectedRoomIds, onToggleRoom }: Props) {
  const [rooms, setRooms] = useState<RoomAvailabilityResult[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!startDate || !endDate) return
    startTransition(async () => {
      const result = await getRoomAvailability(startDate, endDate)
      setRooms(result)
    })
  }, [startDate, endDate])

  if (!startDate || !endDate) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Select dates first to see room availability.</p>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select rooms</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">Select all rooms your group needs. Unavailable rooms are grayed out.</p>

      {isPending ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => {
            const selected = selectedRoomIds.includes(room.id)
            return (
              <button
                key={room.id}
                type="button"
                disabled={!room.available}
                onClick={() => room.available && onToggleRoom(room.id)}
                className={`
                  w-full text-left p-3 rounded-xl border-2 transition-all
                  ${!room.available
                    ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-50 cursor-not-allowed'
                    : selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-500'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{room.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {room.bed_count} bed · {room.max_occupancy} max occupancy
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!room.available && (
                      <span className="text-xs text-red-500 dark:text-red-400 font-medium">Booked</span>
                    )}
                    {room.available && selected && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedRoomIds.length > 0 && (
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {selectedRoomIds.length} room{selectedRoomIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
