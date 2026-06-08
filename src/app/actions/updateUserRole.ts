'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/supabase/types'

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only the administrator can change user roles.' }
  }

  // Prevent self-demotion
  if (targetUserId === user.id && newRole !== 'admin') {
    return { success: false, error: 'You cannot change your own role.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ role: newRole }).eq('id', targetUserId)
  if (error) return { success: false, error: error.message }

  return { success: true }
}
