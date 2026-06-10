'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function markFeedbackReviewed(
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Admin only.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('feedback')
    .update({ status: 'reviewed' })
    .eq('id', feedbackId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
