'use server'

import { createClient } from '@/lib/supabase/server'

interface UpdateBookingPayload {
  notes?: string
  guestCount?: number
  guests?: { name: string; relationship: string }[]
}

export async function updateBooking(
  bookingId: string,
  payload: UpdateBookingPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile) return { success: false, error: 'Profile not found' }

  const { data: booking } = await supabase.from('bookings').select('user_id').eq('id', bookingId).single()
  if (!booking) return { success: false, error: 'Booking not found' }

  const isPapa = (profile.role as string) === 'papa'
  const isOwner = (booking as { user_id: string }).user_id === user.id

  if (!isPapa && !isOwner) return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('bookings')
    .update({
      ...(payload.notes !== undefined && { notes: payload.notes }),
      ...(payload.guestCount !== undefined && { guest_count: payload.guestCount }),
    })
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
