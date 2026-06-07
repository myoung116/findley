'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type FamilyBranch =
  | 'Grandma and Papa'
  | 'Smoothie and Lynn'
  | 'Tom and Moe'
  | 'Keke and Matt'
  | 'Dick and Colleen'

interface SignUpPayload {
  email: string
  password: string
  name: string
  familyBranch: FamilyBranch
}

export async function signUp(
  payload: SignUpPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Create the auth user
  const { data, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  })

  if (authError || !data.user) {
    return { success: false, error: authError?.message ?? 'Sign up failed. Please try again.' }
  }

  // 2. Insert the profile row using the admin client (bypasses RLS)
  //    New users start as viewer — admin (Michael) promotes them from there.
  const admin = createAdminClient()
  const { error: profileError } = await admin.from('users').insert({
    id: data.user.id,
    email: payload.email,
    name: payload.name,
    role: 'viewer',
    family_branch: payload.familyBranch,
  })

  if (profileError) {
    // Auth user was created — clean it up so they don't have a dangling auth account
    await admin.auth.admin.deleteUser(data.user.id)
    return {
      success: false,
      error: 'Account setup failed. Please try again or contact Michael.',
    }
  }

  return { success: true }
}
