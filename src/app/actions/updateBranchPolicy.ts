'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FamilyBranch } from '@/lib/supabase/types'

export interface BranchPolicyInput {
  requireCousinApproval: boolean
  cousinGuestCap: number | null
  // Admin only — which branch to edit. Principals always edit their own branch.
  branch?: FamilyBranch
}

export async function updateBranchPolicy(
  input: BranchPolicyInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role, family_branch').eq('id', user.id).single()
  const profile = profileData as { role: string; family_branch: FamilyBranch } | null
  if (!profile) return { success: false, error: 'Profile not found.' }

  // Resolve the target branch. Principals can only edit their own branch.
  let targetBranch: FamilyBranch
  if (profile.role === 'admin') {
    targetBranch = input.branch ?? profile.family_branch
  } else if (profile.role === 'principal') {
    targetBranch = profile.family_branch
  } else {
    return { success: false, error: 'Only principals and admin can set branch policies.' }
  }

  if (input.cousinGuestCap != null && input.cousinGuestCap < 1) {
    return { success: false, error: 'Guest cap must be at least 1, or empty for no limit.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('branch_policies')
    .upsert(
      {
        family_branch: targetBranch,
        require_cousin_approval: input.requireCousinApproval,
        cousin_guest_cap: input.cousinGuestCap,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'family_branch' }
    )

  if (error) return { success: false, error: error.message }
  return { success: true }
}
