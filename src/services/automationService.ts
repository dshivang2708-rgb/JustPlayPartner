import { supabase } from '../lib/supabase';
import { NotificationChannel } from '../data/automationData';

export type AutomationSettings = {
  monthlyReports: boolean;
  quarterlyReports: boolean;
  halfYearlyReports: boolean;
  yearlyReports: boolean;
  maxAutoIncreasePct: string;
  maxAutoDecreasePct: string;
  requireApprovalAbove: string;
};

export type NotificationPref = {
  categoryKey: string;
  channels: NotificationChannel[];
};

const DEFAULT_SETTINGS: AutomationSettings = {
  monthlyReports: true,
  quarterlyReports: true,
  halfYearlyReports: false,
  yearlyReports: true,
  maxAutoIncreasePct: '15',
  maxAutoDecreasePct: '20',
  requireApprovalAbove: '2000',
};

export async function fetchAutomationSettings(venueId: string): Promise<AutomationSettings> {
  const { data, error } = await supabase
    .from('automation_settings')
    .select('*')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;

  return {
    monthlyReports: data.monthly_reports,
    quarterlyReports: data.quarterly_reports,
    halfYearlyReports: data.half_yearly_reports,
    yearlyReports: data.yearly_reports,
    maxAutoIncreasePct: String(data.max_auto_increase_pct),
    maxAutoDecreasePct: String(data.max_auto_decrease_pct),
    requireApprovalAbove: String(data.require_approval_above),
  };
}

export async function saveAutomationSettings(venueId: string, settings: AutomationSettings): Promise<void> {
  const { error } = await supabase.rpc('save_automation_settings', {
    target_venue_id: venueId,
    p_monthly_reports: settings.monthlyReports,
    p_quarterly_reports: settings.quarterlyReports,
    p_half_yearly_reports: settings.halfYearlyReports,
    p_yearly_reports: settings.yearlyReports,
    p_max_auto_increase_pct: Number(settings.maxAutoIncreasePct) || 0,
    p_max_auto_decrease_pct: Number(settings.maxAutoDecreasePct) || 0,
    p_require_approval_above: Number(settings.requireApprovalAbove) || 0,
  });
  if (error) throw error;
}

const DEFAULT_CHANNELS: Record<string, NotificationChannel[]> = {
  bookings: ['In-App'],
  payments: ['In-App', 'Email'],
  suggestions: ['In-App'],
  reports: ['In-App', 'Email'],
};

export async function fetchNotificationPrefs(venueId: string): Promise<Record<string, NotificationChannel[]>> {
  const { data, error } = await supabase
    .from('automation_notification_prefs')
    .select('category_key, channels')
    .eq('venue_id', venueId);

  if (error) throw error;

  const result = { ...DEFAULT_CHANNELS };
  for (const row of data ?? []) {
    result[row.category_key] = row.channels as NotificationChannel[];
  }
  return result;
}

export async function saveNotificationPref(venueId: string, categoryKey: string, channels: NotificationChannel[]): Promise<void> {
  const { error } = await supabase.rpc('save_notification_pref', {
    target_venue_id: venueId,
    p_category_key: categoryKey,
    p_channels: channels,
  });
  if (error) throw error;
}