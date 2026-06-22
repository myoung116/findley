'use client'

import type { RosterMember } from '@/app/actions/getBranchRoster'

interface Guest {
  name: string
  relationship: string
  isChild?: boolean
}

interface Props {
  roster: RosterMember[]
  selectedMemberIds: string[]
  extraAdults: number
  extraKids: number
  guests: Guest[]
  acknowledged: boolean
  onToggleMember: (id: string) => void
  onExtraAdultsChange: (n: number) => void
  onExtraKidsChange: (n: number) => void
  onGuestsChange: (guests: Guest[]) => void
  onAcknowledgeChange: (checked: boolean) => void
}

function Stepper({ value, min, onChange }: { value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-lg font-medium transition-colors">−</button>
      <span className="text-lg font-bold text-slate-800 dark:text-slate-100 w-5 text-center">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-lg font-medium transition-colors">+</button>
    </div>
  )
}

export function GuestStep({
  roster, selectedMemberIds, extraAdults, extraKids, guests, acknowledged,
  onToggleMember, onExtraAdultsChange, onExtraKidsChange, onGuestsChange, onAcknowledgeChange,
}: Props) {
  function addGuest() { onGuestsChange([...guests, { name: '', relationship: '' }]) }
  function removeGuest(index: number) { onGuestsChange(guests.filter((_, i) => i !== index)) }
  function updateGuest(index: number, field: keyof Guest, value: string | boolean) {
    onGuestsChange(guests.map((g, i) => i === index ? { ...g, [field]: value } : g))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Who&apos;s coming?</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Pick the family members attending. Headcount is taken from the people you select.
        </p>
      </div>

      {/* Branch member picker */}
      {roster.length > 0 ? (
        <div className="space-y-1.5">
          {roster.map(member => {
            const on = selectedMemberIds.includes(member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onToggleMember(member.id)}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                  on
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${on ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {on ? '✓' : ''}
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{member.name}</span>
                  {member.isSelf && <span className="text-[10px] text-slate-400 dark:text-slate-500">(you)</span>}
                </span>
                <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  member.isChild ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {member.isChild ? 'child' : 'adult'}
                </span>
              </button>
            )
          })}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            Missing someone? Add them to your branch on the <a href="/branch" className="text-blue-500 hover:underline">My Branch</a> page.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">No branch roster found. Use the counts below.</p>
      )}

      {/* Additional people not in the roster */}
      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Additional guests not in your roster
          <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">e.g. a baby, or family you haven&apos;t added yet</span>
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Adults</span>
          <Stepper value={extraAdults} min={0} onChange={onExtraAdultsChange} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Kids</span>
          <Stepper value={extraKids} min={0} onChange={onExtraKidsChange} />
        </div>
      </div>

      {/* External (non-family) guests */}
      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">External guests</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Anyone not in the Findley family. Leave blank if none.</p>
        </div>
        {guests.map((guest, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guest {i + 1}</span>
              <button type="button" onClick={() => removeGuest(i)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300">Remove</button>
            </div>
            <input
              type="text" placeholder="Full name" value={guest.name}
              onChange={e => updateGuest(i, 'name', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text" placeholder="Relationship (e.g. spouse, friend)" value={guest.relationship}
              onChange={e => updateGuest(i, 'relationship', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400">
              <input type="checkbox" checked={guest.isChild ?? false} onChange={e => updateGuest(i, 'isChild', e.target.checked)} className="accent-blue-600" />
              This guest is a child (under 13)
            </label>
          </div>
        ))}
        <button type="button" onClick={addGuest} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
          + Add external guest
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={acknowledged} onChange={e => onAcknowledgeChange(e.target.checked)} className="mt-0.5 accent-blue-600" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            I understand that I am responsible for the conduct and care of all guests during this stay,
            including any damages or issues that arise.
          </span>
        </label>
      </div>
    </div>
  )
}
