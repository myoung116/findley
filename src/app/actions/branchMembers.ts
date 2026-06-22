'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FamilyBranch } from '@/lib/supabase/types'

type Caller = { id: string; role: string; family_branch: FamilyBranch }

// Resolve the caller and confirm they may manage a branch roster.
async function getManager(): Promise<{ caller: Caller } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profileData } = await supabase
    .from('users').select('role, family_branch').eq('id', user.id).single()
  const profile = profileData as { role: string; family_branch: FamilyBranch } | null
  if (!profile) return { error: 'Profile not found.' }
  if (!['admin', 'principal'].includes(profile.role)) {
    return { error: 'Only principals and admin can manage branch members.' }
  }
  return { caller: { id: user.id, role: profile.role, family_branch: profile.family_branch } }
}

export async function addBranchMember(
  name: string
): Promise<{ success: boolean; error?: string }> {
  const m = await getManager()
  if ('error' in m) return { success: false, error: m.error }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'Enter a name.' }

  const admin = createAdminClient()
  const { error } = await admin.from('branch_members').insert({
    family_branch: m.caller.family_branch,
    name: trimmed,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeBranchMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const m = await getManager()
  if ('error' in m) return { success: false, error: m.error }

  const admin = createAdminClient()
  const { data: memberData } = await admin
    .from('branch_members').select('family_branch').eq('id', memberId).single()
  const member = memberData as { family_branch: FamilyBranch } | null
  if (!member) return { success: false, error: 'Member not found.' }

  if (m.caller.role !== 'admin' && member.family_branch !== m.caller.family_branch) {
    return { success: false, error: 'You can only manage your own branch.' }
  }

  // Removing a member only drops them from this roster — it never deletes a
  // linked login account.
  const { error } = await admin.from('branch_members').delete().eq('id', memberId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateMemberRoomPreferences(
  memberId: string,
  roomIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const m = await getManager()
  if ('error' in m) return { success: false, error: m.error }

  const admin = createAdminClient()
  const { data: memberData } = await admin
    .from('branch_members').select('family_branch').eq('id', memberId).single()
  const member = memberData as { family_branch: FamilyBranch } | null
  if (!member) return { success: false, error: 'Member not found.' }

  if (m.caller.role !== 'admin' && member.family_branch !== m.caller.family_branch) {
    return { success: false, error: 'You can only manage your own branch.' }
  }

  const { error } = await admin
    .from('branch_members')
    .update({ preferred_room_ids: roomIds })
    .eq('id', memberId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
