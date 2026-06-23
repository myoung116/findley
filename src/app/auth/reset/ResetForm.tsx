'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ResetForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // The /auth/callback route established a recovery session before redirecting
  // here. Confirm it exists so we show a clear message if the link was bad.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setValidSession(!!data.user)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    setDone(true)
    setLoading(false)
    setTimeout(() => { router.push('/'); router.refresh() }, 1500)
  }

  if (!ready) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Checking your link…</p>
  }

  if (!validSession) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This password reset link is invalid or has expired.
        </p>
        <a href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to sign in</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Password updated</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Taking you to the calendar…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">New password</label>
        <input
          type="password" required minLength={8} value={password}
          onChange={e => setPassword(e.target.value)} placeholder="8+ characters"
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Confirm password</label>
        <input
          type="password" required minLength={8} value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
