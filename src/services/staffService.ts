import { supabase } from '../lib/supabase';

export type StaffRole = 'Owner' | 'Manager' | 'Front Desk';

export type Permission =
  | 'Manage bookings'
  | 'Manage pricing'
  | 'View payments'
  | 'Manage staff'
  | 'View analytics'
  | 'Manage marketing';

export const ALL_PERMISSIONS: Permission[] = [
  'Manage bookings',
  'Manage pricing',
  'View payments',
  'Manage staff',
  'View analytics',
  'Manage marketing',
];

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  Owner: ['Manage bookings', 'Manage pricing', 'View payments', 'Manage staff', 'View analytics', 'Manage marketing'],
  Manager: ['Manage bookings', 'Manage pricing', 'View payments', 'View analytics'],
  'Front Desk': ['Manage bookings'],
};

export type StaffMember = {
  /** venue_staff.id for accepted members, staff_invitations.id for pending ones -- see `kind`. */
  id: string;
  venueId: string;
  kind: 'active' | 'pending';
  name: string;
  email?: string; // only known for pending invites (that's all we have until they accept)
  phone?: string; // only known once accepted (comes from their profile)
  role: StaffRole;
  permissions: Permission[];
  joinedLabel: string;
};

function formatJoinedLabel(createdAtIso: string): string {
  return `Joined ${new Date(createdAtIso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

/**
 * Fetches staff for one venue: accepted members (venue_staff joined with
 * their profile) plus still-pending invitations, merged into one list so
 * the partner can see who's in vs who's been invited but hasn't joined yet.
 * RLS scopes both queries to venues the caller owns or manages.
 */
export async function fetchStaffForVenue(venueId: string): Promise<StaffMember[]> {
  const [activeRes, pendingRes] = await Promise.all([
    supabase
      .from('venue_staff')
      .select('id, venue_id, role, permissions, created_at, profiles(full_name, phone)')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true }),
    supabase
      .from('staff_invitations')
      .select('id, venue_id, full_name, invited_email, role, permissions, created_at')
      .eq('venue_id', venueId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  if (activeRes.error) throw activeRes.error;
  if (pendingRes.error) throw pendingRes.error;

  const active: StaffMember[] = (activeRes.data ?? []).map((row: any) => ({
    id: row.id,
    venueId: row.venue_id,
    kind: 'active' as const,
    name: row.profiles?.full_name ?? 'Unknown',
    phone: row.profiles?.phone ?? undefined,
    role: row.role,
    permissions: (row.permissions ?? []) as Permission[],
    joinedLabel: formatJoinedLabel(row.created_at),
  }));

  const pending: StaffMember[] = (pendingRes.data ?? []).map((row: any) => ({
    id: row.id,
    venueId: row.venue_id,
    kind: 'pending' as const,
    name: row.full_name,
    email: row.invited_email,
    role: row.role,
    permissions: (row.permissions ?? []) as Permission[],
    joinedLabel: `Invited ${new Date(row.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
  }));

  const roleOrder: Record<StaffRole, number> = { Owner: 0, Manager: 1, 'Front Desk': 2 };
  active.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  return [...active, ...pending];
}

export async function inviteStaffMember(input: {
  venueId: string;
  fullName: string;
  email: string;
  role: StaffRole;
  permissions: Permission[];
}): Promise<StaffMember> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to invite staff.');

  const { data, error } = await supabase
    .from('staff_invitations')
    .insert({
      venue_id: input.venueId,
      full_name: input.fullName,
      invited_email: input.email.trim().toLowerCase(),
      role: input.role,
      permissions: input.permissions,
      invited_by: user.id,
    })
    .select('id, venue_id, full_name, invited_email, role, permissions, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('There is already a pending invitation for this email at this venue.');
    }
    throw error;
  }

  return {
    id: data.id,
    venueId: data.venue_id,
    kind: 'pending',
    name: data.full_name,
    email: data.invited_email,
    role: data.role,
    permissions: (data.permissions ?? []) as Permission[],
    joinedLabel: `Invited ${new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
  };
}

export async function updateStaffMember(
  staffId: string,
  updates: { role: StaffRole; permissions: Permission[] }
): Promise<void> {
  const { error } = await supabase
    .from('venue_staff')
    .update({ role: updates.role, permissions: updates.permissions })
    .eq('id', staffId);
  if (error) throw error;
}

/** Removes an already-accepted staff member from a venue. */
export async function removeStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase.from('venue_staff').delete().eq('id', staffId);
  if (error) throw error;
}

/** Revokes a pending invitation (keeps the row for audit purposes, marked revoked). */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);
  if (error) throw error;
}

export type ShiftCode = 'M' | 'E' | 'O';
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SHIFT_LABEL: Record<ShiftCode, string> = { M: 'Morning', E: 'Evening', O: 'Off' };

/** Returns a map of venue_staff.id -> 7-length shift array (index 0 = Mon). Missing days default to 'O'. */
export async function fetchShiftsForVenue(venueId: string): Promise<Record<string, ShiftCode[]>> {
  const { data, error } = await supabase
    .from('staff_shifts')
    .select('staff_id, day_of_week, shift_code')
    .eq('venue_id', venueId);

  if (error) throw error;

  const map: Record<string, ShiftCode[]> = {};
  for (const row of data ?? []) {
    if (!map[row.staff_id]) map[row.staff_id] = ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
    map[row.staff_id][row.day_of_week] = row.shift_code as ShiftCode;
  }
  return map;
}

export async function setShift(input: {
  venueId: string;
  staffId: string;
  dayOfWeek: number;
  shiftCode: ShiftCode;
}): Promise<void> {
  const { error } = await supabase
    .from('staff_shifts')
    .upsert(
      {
        venue_id: input.venueId,
        staff_id: input.staffId,
        day_of_week: input.dayOfWeek,
        shift_code: input.shiftCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'staff_id,day_of_week' }
    );
  if (error) throw error;
}