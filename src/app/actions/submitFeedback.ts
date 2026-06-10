'use server'

import { createClient } from '@/lib/supabase/server'

export type FeedbackCategory = 'bug' | 'suggestion' | 'question' | 'other'

export async function submitFeedback(
  category: FeedbackCategory,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!message.trim()) return { success: false, error: 'Message cannot be empty.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: user.id, category, message: message.trim() })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
