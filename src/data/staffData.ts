export type StaffRole = 'Owner' | 'Manager' | 'Front Desk';

export type Permission =
  | 'Manage bookings'
  | 'Manage pricing'
  | 'View payments'
  | 'Manage staff'
  | 'View analytics'
  | 'Manage marketing';

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  Owner: ['Manage bookings', 'Manage pricing', 'View payments', 'Manage staff', 'View analytics', 'Manage marketing'],
  Manager: ['Manage bookings', 'Manage pricing', 'View payments', 'View analytics'],
  'Front Desk': ['Manage bookings'],
};

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  permissions: Permission[];
  joinedLabel: string;
};

export const staffMembers: StaffMember[] = [
  { id: 's1', name: 'Amit Sharma', phone: '98xxxxxx10', role: 'Owner', permissions: ROLE_DEFAULT_PERMISSIONS.Owner, joinedLabel: 'Founding member' },
  { id: 's2', name: 'Deepika Rao', phone: '97xxxxxx22', role: 'Manager', permissions: ROLE_DEFAULT_PERMISSIONS.Manager, joinedLabel: 'Joined Mar 2025' },
  { id: 's3', name: 'Sameer Khan', phone: '96xxxxxx33', role: 'Front Desk', permissions: ROLE_DEFAULT_PERMISSIONS['Front Desk'], joinedLabel: 'Joined Nov 2025' },
  { id: 's4', name: 'Pooja Nair', phone: '95xxxxxx44', role: 'Front Desk', permissions: ROLE_DEFAULT_PERMISSIONS['Front Desk'], joinedLabel: 'Joined Jan 2026' },
];

export type ShiftCode = 'M' | 'E' | 'O'; // Morning / Evening / Off

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const shiftAssignments: Record<string, ShiftCode[]> = {
  s2: ['M', 'M', 'M', 'M', 'M', 'O', 'O'],
  s3: ['E', 'E', 'O', 'E', 'E', 'M', 'M'],
  s4: ['O', 'M', 'M', 'O', 'M', 'E', 'E'],
};

export const SHIFT_LABEL: Record<ShiftCode, string> = { M: 'Morning', E: 'Evening', O: 'Off' };