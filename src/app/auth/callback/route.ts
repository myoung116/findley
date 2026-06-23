import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Handles email-link auth (e.g. password recovery). Supabase redirects here with
// a `code` which we exchange for a session, then forward to `next` (the reset
// page for recovery). Used by resetPasswordForEmail's redirectTo.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, base))
    }
  }

  return NextResponse.redirect(new URL('/login?error=link_expired', base))
}
