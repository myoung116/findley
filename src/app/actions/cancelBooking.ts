'use server'

import { createClient } from '@/lib/supabase/server'

export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile) return { success: false, error: 'Profile not found' }

  const { data: booking } = await supabase.from('bookings').select('user_id, status, end_date').eq('id', bookingId).single()
  if (!booking) return { success: false, error: 'Booking not found' }

  const role = profile.role as string
  const isAdmin = role === 'admin'
  const isPapa = role === 'papa'
  const isOwner = (booking as { user_id: string }).user_id === user.id

  if (!isAdmin && !isPapa && !isOwner) return { success: false, error: 'Not authorized' }

  const isPast = new Date((booking as { end_date: string }).end_date) < new Date()
  if (isPast && !isAdmin) return { success: false, error: 'Past bookings can only be modified by the administrator.' }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
