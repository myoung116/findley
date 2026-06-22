'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FamilyBranch } from '@/lib/supabase/types'

export interface RosterMember {
  id: string
  name: string
  isChild: boolean
  isSelf: boolean // the current user's own roster entry (auto-selected)
}

// Returns the current user's own-branch roster, for picking attendees on a booking.
export async function getBranchRoster(): Promise<RosterMember[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profileData } = await supabase
    .from('users').select('family_branch').eq('id', user.id).single()
  const profile = profileData as { family_branch: FamilyBranch } | null
  if (!profile) return []

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('branch_members')
    .select('id, name, is_child, linked_user_id')
    .eq('family_branch', profile.family_branch)
    .order('name')

  type Row = { id: string; name: string; is_child: boolean; linked_user_id: string | null }
  return ((rows ?? []) as Row[]).map(m => ({
    id: m.id,
    name: m.name,
    isChild: m.is_child,
    isSelf: m.linked_user_id === user.id,
  }))
}
