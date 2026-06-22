'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Reject a pending booking. Admin can reject any; a branch principal can reject
// a pending booking made by a cousin in their own branch. Mirrors the
// authorization in approveBooking.
export async function rejectBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role, family_branch').eq('id', user.id).single()
  const profile = profileData as { role: string; family_branch: string } | null
  if (!profile) return { success: false, error: 'Profile not found.' }

  const admin = createAdminClient()

  const { data: bookingData } = await admin
    .from('bookings')
    .select('id, user_id, status, start_date, end_date, booking_type')
    .eq('id', bookingId)
    .single()

  const booking = bookingData as {
    id: string; user_id: string; status: string
    start_date: string; end_date: string; booking_type: string
  } | null
  if (!booking) return { success: false, error: 'Booking not found.' }
  if (booking.status !== 'pending') {
    return { success: false, error: 'Only pending bookings can be rejected.' }
  }

  let authorized = profile.role === 'admin'
  if (!authorized && profile.role === 'principal') {
    const { data: ownerData } = await admin
      .from('users').select('role, family_branch').eq('id', booking.user_id).single()
    const owner = ownerData as { role: string; family_branch: string } | null
    authorized =
      owner?.role === 'cousin' && owner.family_branch === profile.family_branch
  }

  if (!authorized) {
    return { success: false, error: 'You are not permitted to reject this booking.' }
  }

  const { error } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('status', 'pending')

  if (error) return { success: false, error: error.message }

  await admin.from('notifications').insert({
    user_id: booking.user_id,
    type: 'booking_confirmed', // reuse existing type; payload carries the rejection
    payload: {
      booking_id: bookingId,
      booking_type: booking.booking_type,
      start_date: booking.start_date,
      end_date: booking.end_date,
      status: 'cancelled',
      rejected: true,
      reason: reason ?? null,
    },
  })

  return { success: true }
}
