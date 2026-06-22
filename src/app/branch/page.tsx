import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FamilyBranch, BookingType, BookingStatus } from '@/lib/supabase/types'
import { BranchPolicyForm } from './BranchPolicyForm'
import { BranchPendingQueue, type PendingCousinBooking } from './BranchPendingQueue'
import { BranchMembers, type BranchMember } from './BranchMembers'

export default async function BranchPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users').select('name, role, family_branch').eq('id', user.id).single()
  const profile = profileData as { name: string; role: string; family_branch: FamilyBranch } | null
  if (!profile || !['admin', 'principal'].includes(profile.role)) redirect('/')

  const branch = profile.family_branch
  const admin = createAdminClient()

  // Current branch policy (may not exist yet — defaults applied in the form).
  const { data: policyData } = await admin
    .from('branch_policies')
    .select('require_cousin_approval, cousin_guest_cap')
    .eq('family_branch', branch)
    .maybeSingle()
  const policy = policyData as { require_cousin_approval: boolean; cousin_guest_cap: number | null } | null

  // Cousins in this branch.
  const { data: cousinRows } = await admin
    .from('users')
    .select('id, name')
    .eq('role', 'cousin')
    .eq('family_branch', branch)
  const cousins = (cousinRows ?? []) as { id: string; name: string }[]
  const cousinName = new Map(cousins.map(c => [c.id, c.name]))

  // Pending bookings from those cousins.
  let pending: PendingCousinBooking[] = []
  if (cousins.length > 0) {
    const { data: bookingRows } = await admin
      .from('bookings')
      .select('id, user_id, start_date, end_date, booking_type, status, rooms_requested, guest_count, notes')
      .eq('status', 'pending')
      .in('user_id', cousins.map(c => c.id))
      .order('start_date')

    type Row = {
      id: string; user_id: string; start_date: string; end_date: string
      booking_type: BookingType; status: BookingStatus; rooms_requested: string[]
      guest_count: number; notes: string | null
    }
    pending = ((bookingRows ?? []) as Row[]).map(b => ({
      id: b.id,
      cousinName: cousinName.get(b.user_id) ?? 'Unknown',
      startDate: b.start_date,
      endDate: b.end_date,
      bookingType: b.booking_type,
      roomsRequested: b.rooms_requested ?? [],
      guestCount: b.guest_count,
      notes: b.notes,
    }))
  }

  // All rooms (for display + override picker + room preferences).
  const { data: roomRows } = await admin
    .from('rooms')
    .select('id, name, max_occupancy')
    .order('sort_order')
  const rooms = (roomRows ?? []) as { id: string; name: string; max_occupancy: number }[]

  // Branch roster.
  const { data: memberRows } = await admin
    .from('branch_members')
    .select('id, name, linked_user_id, preferred_room_ids')
    .eq('family_branch', branch)
    .order('name')
  type MemberRow = { id: string; name: string; linked_user_id: string | null; preferred_room_ids: string[] }
  const members: BranchMember[] = ((memberRows ?? []) as MemberRow[]).map(m => ({
    id: m.id,
    name: m.name,
    hasAccount: m.linked_user_id != null,
    preferredRoomIds: m.preferred_room_ids ?? [],
  }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">My Branch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{branch} · cousin policies & approvals</p>
        </div>
        <a href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">← Calendar</a>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          Branch members {members.length > 0 && <span className="text-slate-400">({members.length})</span>}
        </h2>
        <BranchMembers members={members} rooms={rooms.map(r => ({ id: r.id, name: r.name }))} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Cousin policies</h2>
        <BranchPolicyForm
          initialRequireApproval={policy?.require_cousin_approval ?? false}
          initialGuestCap={policy?.cousin_guest_cap ?? null}
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          Pending cousin bookings {pending.length > 0 && <span className="text-blue-500">({pending.length})</span>}
        </h2>
        <BranchPendingQueue bookings={pending} rooms={rooms} />
      </section>
    </div>
  )
}
