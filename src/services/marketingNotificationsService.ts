import { supabase } from '../lib/supabase';

export type NotificationChannel = 'in_app' | 'push';

export type AudienceFilters = {
  sport: string | null;
  minTotalSpend: number | null;
  minTotalBookings: number | null;
  inactiveDays: number | null;
};

export type AudiencePreviewRow = {
  customerId: string;
  customerName: string;
  totalBookings: number;
  totalSpend: number;
  lastVisitLabel: string;
  preferredSport: string;
};

export type Campaign = {
  id: string;
  title: string;
  body: string;
  channels: NotificationChannel[];
  filters: AudienceFilters;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipientCount: number;
  createdAtLabel: string;
  sentAtLabel: string | null;
  failureReason: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function fetchVenueSports(venueId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('venue_sports', { target_venue_id: venueId });
  if (error) throw error;
  return (data ?? []).map((row: any) => row.sport);
}

export async function previewAudience(venueId: string, filters: AudienceFilters): Promise<AudiencePreviewRow[]> {
  const { data, error } = await supabase.rpc('venue_marketing_audience', {
    target_venue_id: venueId,
    filter_sport: filters.sport,
    filter_min_total_spend: filters.minTotalSpend,
    filter_min_total_bookings: filters.minTotalBookings,
    filter_inactive_days: filters.inactiveDays,
  });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    customerId: row.customer_id,
    customerName: row.customer_name || 'Unknown',
    totalBookings: Number(row.total_bookings),
    totalSpend: Number(row.total_spend),
    lastVisitLabel: formatDate(row.last_visit),
    preferredSport: row.preferred_sport || '—',
  }));
}

/**
 * Creates the campaign row (status='draft') and immediately triggers the
 * actual send via the send-marketing-campaign Edge Function. Two steps
 * because the campaign row itself is a normal, directly-insertable record
 * under RLS -- only the fan-out to other users' inboxes/devices needs the
 * service-role-backed function.
 */
export async function createAndSendCampaign(input: {
  venueId: string;
  title: string;
  body: string;
  channels: NotificationChannel[];
  filters: AudienceFilters;
}): Promise<{ recipientCount: number; pushSent: number; pushFailed: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign, error: insertError } = await supabase
    .from('notification_campaigns')
    .insert({
      venue_id: input.venueId,
      title: input.title,
      body: input.body,
      channels: input.channels,
      filter_sport: input.filters.sport,
      filter_min_total_spend: input.filters.minTotalSpend,
      filter_min_total_bookings: input.filters.minTotalBookings,
      filter_inactive_days: input.filters.inactiveDays,
      created_by: user?.id,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  const { data, error } = await supabase.functions.invoke('send-marketing-campaign', {
    body: { campaignId: campaign.id },
  });

  if (error) {
    const message = (error as any)?.context?.body?.message ?? error.message ?? 'Could not send this campaign.';
    throw new Error(message);
  }

  return data as { recipientCount: number; pushSent: number; pushFailed: number };
}

export async function fetchCampaignHistory(venueId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('notification_campaigns')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    channels: row.channels,
    filters: {
      sport: row.filter_sport,
      minTotalSpend: row.filter_min_total_spend,
      minTotalBookings: row.filter_min_total_bookings,
      inactiveDays: row.filter_inactive_days,
    },
    status: row.status,
    recipientCount: row.recipient_count,
    createdAtLabel: formatDate(row.created_at),
    sentAtLabel: row.sent_at ? formatDate(row.sent_at) : null,
    failureReason: row.failure_reason,
  }));
}

export function describeFilters(filters: AudienceFilters): string {
  const parts: string[] = [];
  if (filters.sport) parts.push(`plays ${filters.sport}`);
  if (filters.minTotalSpend) parts.push(`spent ≥ ₹${filters.minTotalSpend.toLocaleString('en-IN')}`);
  if (filters.minTotalBookings) parts.push(`≥ ${filters.minTotalBookings} bookings`);
  if (filters.inactiveDays) parts.push(`inactive ${filters.inactiveDays}+ days`);
  return parts.length > 0 ? parts.join(' · ') : 'All registered players';
}