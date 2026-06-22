'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FamilyBranch } from '@/lib/supabase/types'

export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profileData } = await supabase.from('users').select('role, family_branch').eq('id', user.id).single()
  const profile = profileData as { role: string; family_branch: FamilyBranch } | null
  if (!profile) return { success: false, error: 'Profile not found' }

  const admin = createAdminClient()
  const { data: bookingData } = await admin.from('bookings').select('user_id, status, end_date').eq('id', bookingId).single()
  const booking = bookingData as { user_id: string; status: string; end_date: string } | null
  if (!booking) return { success: false, error: 'Booking not found' }

  // Owner's branch (for the branch-principal check).
  const { data: ownerData } = await admin.from('users').select('family_branch').eq('id', booking.user_id).single()
  const ownerBranch = (ownerData as { family_branch: FamilyBranch } | null)?.family_branch

  // Authorization: admin (any), owner, or the principal of the owner's branch.
  const isAdmin = profile.role === 'admin'
  const isOwner = booking.user_id === user.id
  const isBranchPrincipal = profile.role === 'principal' && profile.family_branch === ownerBranch
  if (!isAdmin && !isOwner && !isBranchPrincipal) return { success: false, error: 'Not authorized' }

  const isPast = new Date(booking.end_date) < new Date()
  if (isPast && !isAdmin) return { success: false, error: 'Past bookings can only be modified by the administrator.' }

  // Use the admin client: a principal can't update another member's booking under RLS.
  const { error } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
