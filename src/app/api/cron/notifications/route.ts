import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/email/send'
import type { NotificationType } from '@/lib/supabase/types'

function isAuthorized(req: Request): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all unsent notifications with recipient info, oldest first
  // Process in batches of 50 to stay within execution limits
  const { data: pending } = await supabase
    .from('notifications')
    .select('id, type, payload, users(name, email)')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  type PendingRow = {
    id: string
    type: string
    payload: Record<string, unknown>
    users: { name: string; email: string } | null
  }

  const rows = (pending ?? []) as PendingRow[]

  if (rows.length === 0) {
    return NextResponse.json({ message: 'No pending notifications', sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const row of rows) {
    if (!row.users?.email) {
      // Mark as sent anyway to avoid re-processing orphaned records
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id)
      continue
    }

    const success = await sendNotification({
      id: row.id,
      type: row.type as NotificationType,
      payload: row.payload,
      recipientName: row.users.name,
      recipientEmail: row.users.email,
    })

    if (success) {
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } else {
      failed++
    }
  }

  return NextResponse.json({ message: 'Notifications processed', sent, failed })
}
