import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { BOOKING_TYPE_LABELS } from '@/lib/booking/dates'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { BookingType } from '@/lib/supabase/types'

type ConflictWithBookings = {
  id: string
  status: string
  created_at: string
  booking_a: {
    id: string
    start_date: string
    end_date: string
    booking_type: string
    users: { name: string } | null
  } | null
  booking_b: {
    id: string
    start_date: string
    end_date: string
    booking_type: string
    users: { name: string } | null
  } | null
}

type WaiverRow = {
  score: number
  nights_ttm: number
  requests_ttm: number
  calculated_at: string
  users: { name: string; family_branch: string } | null
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin')

  const { data: profileData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null

  if (!profile || (profile.role !== 'principal' && profile.role !== 'papa')) {
    redirect('/')
  }

  // Open conflicts with booking details
  const { data: conflictsRaw } = await supabase
    .from('conflicts')
    .select(`
      id, status, created_at,
      booking_a:bookings!conflicts_booking_id_a_fkey(id, start_date, end_date, booking_type, users(name)),
      booking_b:bookings!conflicts_booking_id_b_fkey(id, start_date, end_date, booking_type, users(name))
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const conflicts = (conflictsRaw ?? []) as ConflictWithBookings[]

  // Latest waiver score per user
  const { data: scoresRaw } = await supabase
    .from('waiver_scores')
    .select('score, nights_ttm, requests_ttm, calculated_at, users(name, family_branch)')
    .order('calculated_at', { ascending: false })

  // Dedupe to latest score per user
  const seen = new Set<string>()
  const scores: WaiverRow[] = []
  for (const row of (scoresRaw ?? []) as WaiverRow[]) {
    const name = row.users?.name ?? ''
    if (!seen.has(name)) {
      seen.add(name)
      scores.push(row)
    }
  }
  scores.sort((a, b) => a.score - b.score)

  // Recent notifications (last 50)
  const { data: notificationsRaw } = await supabase
    .from('notifications')
    .select('id, type, payload, created_at, sent_at, users(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  type NotifRow = {
    id: string; type: string; payload: Record<string, unknown>
    created_at: string; sent_at: string | null
    users: { name: string } | null
  }
  const notifications = (notificationsRaw ?? []) as NotifRow[]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">←</a>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Admin</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* Conflict Queue */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Conflict Queue
            {conflicts.length > 0 && (
              <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                {conflicts.length} open
              </span>
            )}
          </h2>

          {conflicts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No open conflicts
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map(conflict => (
                <div key={conflict.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Flagged {format(parseISO(conflict.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                      Needs resolution
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[conflict.booking_a, conflict.booking_b].map((b, i) => b && (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{b.users?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {format(parseISO(b.start_date), 'MMM d')} – {format(parseISO(b.end_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {BOOKING_TYPE_LABELS[b.booking_type as BookingType] ?? b.booking_type}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                    Conflicts are resolved socially — coordinate directly with the principals involved.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Waiver Leaderboard */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">Waiver Priority</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Lower score = higher priority for open/shared bookings. Recalculated every Monday.</p>

          {scores.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No scores calculated yet
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="grid grid-cols-4 text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Principal</span>
                <span className="text-right">Score</span>
                <span className="text-right">Bedroom nights</span>
                <span className="text-right">Requests</span>
              </div>
              {scores.map((row, i) => (
                <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{row.users?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{row.users?.family_branch}</p>
                  </div>
                  <p className="text-right font-mono font-semibold text-slate-700 dark:text-slate-200">{row.score.toFixed(1)}</p>
                  <p className="text-right text-slate-500 dark:text-slate-400">{row.nights_ttm}</p>
                  <p className="text-right text-slate-500 dark:text-slate-400">{row.requests_ttm}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notification Log */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">Notification Log</h2>

          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No notifications yet
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.users?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{n.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">{format(parseISO(n.created_at), 'MMM d, h:mm a')}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${n.sent_at ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                      {n.sent_at ? 'sent' : 'queued'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
