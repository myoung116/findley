'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/app/actions/updateUserRole'
import type { UserRole } from '@/lib/supabase/types'

export interface UserRow {
  id: string
  name: string
  email: string
  family_branch: string
  role: UserRole
  created_at: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:     'Admin',
  papa:      'Papa',
  principal: 'Principal',
  viewer:    'Viewer',
}

const ROLE_OPTIONS: UserRole[] = ['admin', 'papa', 'principal', 'viewer']

const ROLE_BADGE: Record<UserRole, string> = {
  admin:     'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  papa:      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  principal: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  viewer:    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
}

function UserRoleSelect({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isSelf = user.id === currentUserId

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole
    setError(null)
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to update role')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={user.role}
        onChange={handleChange}
        disabled={isPending || isSelf}
        className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ROLE_OPTIONS.map(r => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">Saving...</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
      {isSelf && <span className="text-xs text-slate-400 dark:text-slate-500">You</span>}
    </div>
  )
}

export function UserManagement({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const pending = users.filter(u => u.role === 'viewer')
  const active  = users.filter(u => u.role !== 'viewer')

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Users
        {pending.length > 0 && (
          <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
            {pending.length} pending approval
          </span>
        )}
      </h2>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        Change a user&apos;s role using the dropdown. Viewers are pending approval.
      </p>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Pending viewers — shown first with amber highlight */}
        {pending.map(u => (
          <div key={u.id} className="px-4 py-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{u.family_branch}</p>
            </div>
            <UserRoleSelect user={u} currentUserId={currentUserId} />
          </div>
        ))}

        {/* Active users */}
        {active.map((u, i) => (
          <div key={u.id} className={`px-4 py-3 flex items-center justify-between gap-4 ${i < active.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{u.family_branch}</p>
            </div>
            <UserRoleSelect user={u} currentUserId={currentUserId} />
          </div>
        ))}

        {users.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No users yet</p>
        )}
      </div>
    </section>
  )
}
