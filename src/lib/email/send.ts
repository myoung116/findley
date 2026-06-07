import { Resend } from 'resend'
import { buildEmailContent } from './templates'
import type { NotificationType } from '@/lib/supabase/types'

// Lazy-initialized so missing env var doesn't crash at build time
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Findley Lake <noreply@findleylake.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://findleylake.com'

export interface NotificationRecord {
  id: string
  type: NotificationType
  payload: Record<string, unknown>
  recipientName: string
  recipientEmail: string
}

export async function sendNotification(notification: NotificationRecord): Promise<boolean> {
  const content = buildEmailContent(
    notification.type,
    notification.payload,
    notification.recipientName,
    APP_URL
  )

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: notification.recipientEmail,
    subject: content.subject,
    html: content.html,
  })

  if (error) {
    console.error(`Failed to send notification ${notification.id}:`, error)
    return false
  }

  return true
}
