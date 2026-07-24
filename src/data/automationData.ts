export type ReportCadenceSetting = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const initialReportCadence: ReportCadenceSetting[] = [
  { key: 'monthly', label: 'Monthly reports', description: 'Auto-generate on the 1st of every month', enabled: true },
  { key: 'quarterly', label: 'Quarterly reports', description: 'Auto-generate at the end of each quarter', enabled: true },
  { key: 'halfYearly', label: 'Half-yearly reports', description: 'Auto-generate every 6 months', enabled: false },
  { key: 'yearly', label: 'Yearly reports', description: 'Auto-generate at the end of the financial year', enabled: true },
];

export type NotificationChannel = 'In-App' | 'Email' | 'WhatsApp';
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['In-App', 'Email', 'WhatsApp'];

export type NotificationCategory = {
  key: string;
  label: string;
  description: string;
  channels: NotificationChannel[];
};

export const initialNotificationCategories: NotificationCategory[] = [
  { key: 'bookings', label: 'New bookings & cancellations', description: 'Real-time alerts as they happen', channels: ['In-App'] },
  { key: 'payments', label: 'Payment confirmations', description: 'When a customer completes payment', channels: ['In-App', 'Email'] },
  { key: 'suggestions', label: 'New suggestions', description: 'When a new AI recommendation is generated', channels: ['In-App'] },
  { key: 'reports', label: 'Report ready', description: 'When an auto-generated report is available', channels: ['In-App', 'Email'] },
];

export type PricingGuardrails = {
  maxAutoIncreasePct: string;
  maxAutoDecreasePct: string;
  requireApprovalAbove: string;
};

export const initialPricingGuardrails: PricingGuardrails = {
  maxAutoIncreasePct: '15',
  maxAutoDecreasePct: '20',
  requireApprovalAbove: '2000',
};