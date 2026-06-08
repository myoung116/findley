'use server'

import { createClient } from '@/lib/supabase/server'

export async function approveBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null

  if (!profile || (profile.role !== 'admin' && profile.role !== 'papa')) {
    return { success: false, error: 'Only admin can approve bookings.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
    .eq('status', 'pending') // only move pending → confirmed

  if (error) return { success: false, error: error.message }

  // Notify the booking owner
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('user_id, start_date, end_date, booking_type')
    .eq('id', bookingId)
    .single()

  if (bookingData) {
    await supabase.from('notifications').insert({
      user_id: bookingData.user_id,
      type: 'booking_confirmed',
      payload: {
        booking_id: bookingId,
        booking_type: bookingData.booking_type,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        status: 'confirmed',
      },
    })
  }

  return { success: true }
}
