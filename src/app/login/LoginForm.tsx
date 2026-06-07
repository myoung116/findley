'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

const FAMILY_BRANCHES = [
  'Grandma and Papa',
  'Smoothie and Lynn',
  'Tom and Moe',
  'Keke and Matt',
  'Dick and Colleen',
] as const

type FamilyBranch = typeof FAMILY_BRANCHES[number]

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [familyBranch, setFamilyBranch] = useState<FamilyBranch | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  function reset() {
    setError(null)
    setEmail('')
    setPassword('')
    setName('')
    setFamilyBranch('')
  }

  function switchMode(next: Mode) {
    reset()
    setMode(next)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!familyBranch) { setError('Please select your family branch.'); return }
    const branch = familyBranch as FamilyBranch

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Create auth user
    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !data.user) {
      setError(authError?.message ?? 'Sign up failed. Please try again.')
      setLoading(false)
      return
    }

    // Insert profile row — role defaults to viewer, admin can promote later
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      name,
      role: 'viewer',
      family_branch: branch,
    })

    if (profileError) {
      setError('Account created but profile setup failed. Contact Michael to complete setup.')
      setLoading(false)
      return
    }

    setSignedUp(true)
    setLoading(false)
  }

  // Success screen after sign-up
  if (signedUp) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">Request submitted</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Michael will review and approve your account. You&apos;ll be able to sign in once your role has been set.
          </p>
        </div>
        <button
          onClick={() => { setSignedUp(false); switchMode('signin') }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  if (mode === 'signup') {
    return (
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Family branch</label>
          <select
            required
            value={familyBranch}
            onChange={e => setFamilyBranch(e.target.value as FamilyBranch | '')}
            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select your branch…</option>
            {FAMILY_BRANCHES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8+ characters"
            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account…' : 'Request access'}
        </button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button type="button" onClick={() => switchMode('signin')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign in
          </button>
        </p>
      </form>
    )
  }

  // Sign-in mode
  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        New to Findley Lake?{' '}
        <button type="button" onClick={() => switchMode('signup')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Request access
        </button>
      </p>
    </form>
  )
}
