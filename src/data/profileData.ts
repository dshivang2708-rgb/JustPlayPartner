export type PartnerProfile = {
  name: string;
  email: string;
  organisationName: string;
  mobileNumber: string;
  location: string;
  joinedLabel: string;
};

export const partnerProfile: PartnerProfile = {
  name: 'Amit Sharma',
  email: 'amit.sharma@sunrisearena.in',
  organisationName: 'Sunrise Sports Arena',
  mobileNumber: '+91 98xxxxxx10',
  location: 'Chandigarh, Punjab',
  joinedLabel: 'Partner since Mar 2025',
};

export type AccountDetails = {
  accountNumber: string;
  accountName: string;
  ifscCode: string;
  panNumber: string;
  gstin: string;
  cin: string;
  branchAddress: string;
};

export const accountDetails: AccountDetails = {
  accountNumber: '5021 4487 9012',
  accountName: 'Sunrise Sports Arena Pvt Ltd',
  ifscCode: 'HDFC0001234',
  panNumber: 'ABCPS1234D',
  gstin: '03ABCPS1234D1Z5',
  cin: 'U92419CH2024PTC012345',
  branchAddress: 'HDFC Bank, Sector 17, Chandigarh, 160017',
};

export type NotificationPreferences = {
  whatsappUpdates: boolean;
  emailUpdates: boolean;
};

export const initialNotificationPreferences: NotificationPreferences = {
  whatsappUpdates: true,
  emailUpdates: true,
};

/** Fields that show masked by default — only the last few characters are visible until revealed. */
export const SENSITIVE_FIELDS = ['accountNumber', 'panNumber', 'gstin'] as const;

export function maskValue(value: string): string {
  const visible = 4;
  const clean = value.replace(/\s/g, '');
  if (clean.length <= visible) return value;
  const masked = '•'.repeat(clean.length - visible) + clean.slice(-visible);
  return masked;
}