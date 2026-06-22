'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin-only: set a room's flex sleeping capacity (extra spots beyond real beds
// — pack/play, air mattress, couch). max_occupancy (real beds) is unchanged.
export async function updateRoomFlex(
  roomId: string,
  flexCapacity: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admin can edit room capacity.' }
  }

  if (!Number.isInteger(flexCapacity) || flexCapacity < 0) {
    return { success: false, error: 'Flex capacity must be 0 or a positive whole number.' }
  }
  if (flexCapacity > 6) {
    return { success: false, error: 'A room can have at most 6 flex sleeping spots.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('rooms')
    .update({ flex_capacity: flexCapacity })
    .eq('id', roomId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
