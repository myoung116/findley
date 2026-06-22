'use client'

interface Guest {
  name: string
  relationship: string
  isChild?: boolean
}

interface Props {
  guests: Guest[]
  acknowledged: boolean
  onGuestsChange: (guests: Guest[]) => void
  onAcknowledgeChange: (checked: boolean) => void
}

export function GuestStep({ guests, acknowledged, onGuestsChange, onAcknowledgeChange }: Props) {
  function addGuest() {
    onGuestsChange([...guests, { name: '', relationship: '' }])
  }

  function removeGuest(index: number) {
    onGuestsChange(guests.filter((_, i) => i !== index))
  }

  function updateGuest(index: number, field: keyof Guest, value: string | boolean) {
    const updated = guests.map((g, i) => i === index ? { ...g, [field]: value } : g)
    onGuestsChange(updated)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">External guests</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Anyone attending who is not a Findley family member. Leave blank if none.
        </p>
      </div>

      <div className="space-y-3">
        {guests.map((guest, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guest {i + 1}</span>
              <button
                type="button"
                onClick={() => removeGuest(i)}
                className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              placeholder="Full name"
              value={guest.name}
              onChange={e => updateGuest(i, 'name', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Relationship (e.g. spouse, friend)"
              value={guest.relationship}
              onChange={e => updateGuest(i, 'relationship', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={guest.isChild ?? false}
                onChange={e => updateGuest(i, 'isChild', e.target.checked)}
                className="accent-blue-600"
              />
              This guest is a child (under 13)
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addGuest}
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
      >
        + Add external guest
      </button>

      <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => onAcknowledgeChange(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            I understand that I am responsible for the conduct and care of all guests during this stay,
            including any damages or issues that arise.
          </span>
        </label>
      </div>
    </div>
  )
}
