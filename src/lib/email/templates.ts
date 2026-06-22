import type { NotificationType } from '@/lib/supabase/types'
import { format, parseISO } from 'date-fns'

export interface EmailContent {
  subject: string
  html: string
}

function dateRange(start: string, end: string): string {
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`
}

function layout(body: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 32px;">
        <h2 style="margin: 0 0 4px; font-size: 20px;">Findley Lake</h2>
        <p style="margin: 0 0 24px; color: #94a3b8; font-size: 13px;">Family house calendar</p>
        ${body}
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        Findley Lake · Family access only
      </p>
    </div>
  `
}

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;margin-top:16px;">${label}</a>`
}

export function buildEmailContent(
  type: NotificationType,
  payload: Record<string, unknown>,
  recipientName: string,
  appUrl: string
): EmailContent {
  const hi = `<p style="margin:0 0 16px;">Hi ${recipientName},</p>`

  switch (type) {
    case 'exclusive_overlap': {
      const principal = payload.conflicting_principal as string
      const dates = payload.dates_requested as { start: string; end: string }
      return {
        subject: `Scheduling overlap with ${principal} — Findley Lake`,
        html: layout(`
          ${hi}
          <p><strong>${principal}</strong> has submitted an exclusive block request that overlaps with yours:</p>
          <p style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;font-size:14px;">
            <strong>Overlapping dates:</strong> ${dateRange(dates.start, dates.end)}
          </p>
          <p>Exclusive block conflicts are resolved socially — reach out to coordinate directly.</p>
          ${btn('View Calendar', appUrl)}
        `),
      }
    }

    case 'papa_overlap': {
      const dates = payload.dates_requested as { start: string; end: string }
      const roomsAvailable = payload.rooms_available as Array<{ name: string }>
      return {
        subject: `Your booking has been bumped by Papa — Findley Lake`,
        html: layout(`
          ${hi}
          <p>Papa has submitted a booking for <strong>${dateRange(dates.start, dates.end)}</strong> that overlaps with yours. Your booking has been bumped.</p>
          ${roomsAvailable.length > 0 ? `
            <p style="margin-top:16px;"><strong>Rooms still available for those dates:</strong></p>
            <ul style="margin:8px 0;padding-left:20px;">
              ${roomsAvailable.map(r => `<li>${r.name}</li>`).join('')}
            </ul>
          ` : ''}
          ${btn('Submit a New Request', `${appUrl}/book`)}
        `),
      }
    }

    case 'conflict_deadline_3wk': {
      const laborDay = payload.labor_day as string
      return {
        subject: `3 weeks to resolve your scheduling conflict — Findley Lake`,
        html: layout(`
          ${hi}
          <p>You have an unresolved exclusive block conflict. Labor Day lock-in is on <strong>${format(parseISO(laborDay), 'MMMM d, yyyy')}</strong> — approximately <strong>3 weeks away</strong>.</p>
          <p>After lock-in, all pending off-season exclusive blocks are confirmed as submitted. Reach out to the other principal now to coordinate.</p>
          ${btn('View Conflicts', `${appUrl}/admin`)}
        `),
      }
    }

    case 'conflict_deadline_1wk': {
      const laborDay = payload.labor_day as string
      return {
        subject: `Final notice: 1 week to resolve your conflict — Findley Lake`,
        html: layout(`
          ${hi}
          <p>⚠️ <strong>Final notice.</strong> Labor Day lock-in is on <strong>${format(parseISO(laborDay), 'MMMM d, yyyy')}</strong> — less than one week away.</p>
          <p>You still have an unresolved exclusive block conflict. Blocks will lock in as-is unless you cancel or adjust your request before Labor Day.</p>
          ${btn('View Conflicts', `${appUrl}/admin`)}
        `),
      }
    }

    case 'post_lockin_cancellation': {
      const dates = payload.dates_requested as { start: string; end: string }
      return {
        subject: `A week you flagged is now available — Findley Lake`,
        html: layout(`
          ${hi}
          <p>An off-season exclusive block you flagged interest in has been <strong>cancelled</strong>:</p>
          <p style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;font-size:14px;">
            <strong>${dateRange(dates.start, dates.end)}</strong>
          </p>
          <p>This week is now back in the open pool.</p>
          ${btn('Request This Week', `${appUrl}/book`)}
        `),
      }
    }

    case 'waiver_bump': {
      const dates = payload.dates_requested as { start: string; end: string }
      const roomsRequested = payload.rooms_requested as string[]
      const roomsAvailable = payload.rooms_available as Array<{ name: string }>
      const conflicting = payload.conflicting_principal as string
      return {
        subject: `Your booking request was bumped — Findley Lake`,
        html: layout(`
          ${hi}
          <p>Your open/shared request for <strong>${dateRange(dates.start, dates.end)}</strong> was bumped by <strong>${conflicting}</strong>, who has higher booking priority at this time.</p>
          <p style="font-size:13px;color:#64748b;">You requested ${roomsRequested.length} room(s). Your waiver score will be recalculated Monday.</p>
          ${roomsAvailable.length > 0 ? `
            <p style="margin-top:16px;"><strong>Rooms available for those dates:</strong></p>
            <ul style="margin:8px 0;padding-left:20px;">
              ${roomsAvailable.map(r => `<li>${r.name}</li>`).join('')}
            </ul>
          ` : '<p style="margin-top:12px;color:#ef4444;">No rooms available for those dates.</p>'}
          ${btn('Submit a New Request', `${appUrl}/book`)}
        `),
      }
    }

    case 'booking_confirmed': {
      const bookingType = payload.booking_type as string
      const startDate = payload.start_date as string
      const endDate = payload.end_date as string
      const status = payload.status as string
      const typeLabel: Record<string, string> = {
        exclusive_offseason: 'Off-Season Exclusive',
        exclusive_peak: 'Peak Season Exclusive',
        open_shared: 'Open / Shared',
        lastminute_guest: 'Last-Minute Guest',
      }
      return {
        subject: `Booking ${status === 'confirmed' ? 'confirmed' : 'received'} — Findley Lake`,
        html: layout(`
          ${hi}
          <p>Your <strong>${typeLabel[bookingType] ?? bookingType}</strong> request has been ${status === 'confirmed' ? '<strong>confirmed</strong>' : 'received and is <strong>pending</strong>'}.</p>
          <p style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;font-size:14px;">
            <strong>Dates:</strong> ${dateRange(startDate, endDate)}
          </p>
          ${status === 'pending' ? '<p style="font-size:13px;color:#64748b;">Pending bookings are visible to admins. You\'ll receive another email when it\'s confirmed.</p>' : ''}
          ${btn('View Calendar', appUrl)}
        `),
      }
    }

    case 'cousin_pending_approval': {
      const cousin = payload.cousin_name as string
      const startDate = payload.start_date as string
      const endDate = payload.end_date as string
      const guestCount = payload.guest_count as number
      return {
        subject: `${cousin} needs your approval — Findley Lake`,
        html: layout(`
          ${hi}
          <p><strong>${cousin}</strong> in your family branch has requested a stay that needs your approval:</p>
          <p style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;font-size:14px;">
            <strong>Dates:</strong> ${dateRange(startDate, endDate)}<br/>
            <strong>Guests:</strong> ${guestCount}
          </p>
          <p>You can approve it as-is, adjust the rooms, or reject it from your branch page.</p>
          ${btn('Review Request', `${appUrl}/branch`)}
        `),
      }
    }
  }
}
