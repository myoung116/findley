'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addBranchMember, removeBranchMember, updateMemberRoomPreferences, setMemberIsChild } from '@/app/actions/branchMembers'

export interface BranchMember {
  id: string
  name: string
  hasAccount: boolean
  preferredRoomIds: string[]
  isChild: boolean
}

interface Room { id: string; name: string }

export function BranchMembers({ members, rooms }: { members: BranchMember[]; rooms: Room[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [newIsChild, setNewIsChild] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add() {
    setError(null)
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await addBranchMember(newName, newIsChild)
      if (res.success) { setNewName(''); setNewIsChild(false); router.refresh() }
      else setError(res.error ?? 'Could not add member.')
    })
  }

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
        {members.length === 0 ? (
          <p className="p-5 text-sm text-slate-400 dark:text-slate-500">No members yet.</p>
        ) : (
          members.map(member => <MemberRow key={member.id} member={member} rooms={rooms} />)
        )}
      </div>

      {/* Add member */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="Add a family member (e.g. a child or spouse)"
          className="flex-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={newIsChild} onChange={e => setNewIsChild(e.target.checked)} className="accent-blue-600" />
          Child
        </label>
        <button
          onClick={add}
          disabled={pending || !newName.trim()}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function MemberRow({ member, rooms }: { member: BranchMember; rooms: Room[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string[]>(member.preferredRoomIds)
  const [child, setChild] = useState(member.isChild)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const roomName = (id: string) => rooms.find(r => r.id === id)?.name ?? 'Unknown'

  function toggleChild() {
    const next = !child
    setChild(next)
    startTransition(async () => {
      const res = await setMemberIsChild(member.id, next)
      if (res.success) router.refresh()
      else { setChild(!next); setError(res.error ?? 'Could not update.') }
    })
  }

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  function savePrefs() {
    setError(null)
    startTransition(async () => {
      const res = await updateMemberRoomPreferences(member.id, selected)
      if (res.success) { setEditing(false); router.refresh() }
      else setError(res.error ?? 'Could not save.')
    })
  }

  function remove() {
    if (!confirm(`Remove ${member.name} from this branch's roster? This does not delete any login account.`)) return
    startTransition(async () => {
      const res = await removeBranchMember(member.id)
      if (res.success) router.refresh()
      else setError(res.error ?? 'Could not remove.')
    })
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800 dark:text-slate-100">{member.name}</span>
            {member.hasAccount && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">account</span>
            )}
            <button
              type="button"
              onClick={toggleChild}
              disabled={pending}
              title="Toggle adult / child"
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full transition-colors disabled:opacity-50 ${
                child
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {child ? 'child' : 'adult'}
            </button>
          </div>
          {!editing && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-slate-400 dark:text-slate-500">Preferred rooms: </span>
              {selected.length > 0 ? selected.map(roomName).join(', ') : 'None set'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <button onClick={() => setEditing(e => !e)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400">
            {editing ? 'Cancel' : 'Edit rooms'}
          </button>
          <button onClick={remove} disabled={pending} className="text-red-500 hover:text-red-700 dark:text-red-400 disabled:opacity-40">
            Remove
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {rooms.map(r => {
              const on = selected.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    on
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {r.name}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={savePrefs}
              disabled={pending}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              {pending ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  )
}
