'use client'

import { useState, useTransition } from 'react'
import { updateBranchPolicy } from '@/app/actions/updateBranchPolicy'

interface Props {
  initialRequireApproval: boolean
  initialGuestCap: number | null
}

export function BranchPolicyForm({ initialRequireApproval, initialGuestCap }: Props) {
  const [requireApproval, setRequireApproval] = useState(initialRequireApproval)
  const [capEnabled, setCapEnabled] = useState(initialGuestCap != null)
  const [cap, setCap] = useState(initialGuestCap?.toString() ?? '4')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    setSaved(false)
    const cousinGuestCap = capEnabled ? parseInt(cap, 10) : null
    if (capEnabled && (!cousinGuestCap || cousinGuestCap < 1)) {
      setError('Enter a guest cap of at least 1, or turn the cap off.')
      return
    }
    startTransition(async () => {
      const res = await updateBranchPolicy({ requireCousinApproval: requireApproval, cousinGuestCap })
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(res.error ?? 'Could not save.')
      }
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-5">
      <label className="flex items-start justify-between gap-4 cursor-pointer">
        <span>
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Require my approval</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cousins&apos; open &amp; last-minute bookings wait for your approval instead of auto-confirming.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={requireApproval}
          onClick={() => setRequireApproval(v => !v)}
          className={`shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors ${requireApproval ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${requireApproval ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </label>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Cap cousin guests</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Limit how many guests a cousin can bring on a single booking.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={capEnabled}
            onClick={() => setCapEnabled(v => !v)}
            className={`shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors ${capEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${capEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
        {capEnabled && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={cap}
              onChange={e => setCap(e.target.value)}
              className="w-20 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-800 dark:text-slate-100"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">guests max per booking</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={pending}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save policies'}
        </button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </div>
  )
}
