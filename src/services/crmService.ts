import { supabase } from '../lib/supabase';

export type Customer = {
  phone: string; // the stable CRM identity -- see venue_customers() in the migration for why
  name: string;
  totalBookings: number;
  totalSpendLabel: string;
  lastVisitLabel: string;
  preferredSport: string;
};

export type BookingHistoryEntry = {
  id: string;
  dateLabel: string;
  courtName: string;
  amountLabel: string;
  status: 'completed' | 'cancelled' | 'confirmed';
  wasRescheduled: boolean;
  cancellationReason: string | null;
};

export type CancellationLogEntry = {
  id: string;
  customerName: string;
  courtName: string;
  dateLabel: string;
  type: 'cancelled' | 'rescheduled';
  reason: string;
};

function formatRupees(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function fetchCustomersForVenue(venueId: string): Promise<Customer[]> {
  const { data, error } = await supabase.rpc('venue_customers', { target_venue_id: venueId });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    phone: row.customer_phone,
    name: row.customer_name || 'Unknown',
    totalBookings: Number(row.total_bookings),
    totalSpendLabel: formatRupees(row.total_spend),
    lastVisitLabel: formatDate(row.last_visit),
    preferredSport: row.preferred_sport || '—',
  }));
}

export async function fetchCustomerBookingHistory(venueId: string, phone: string): Promise<BookingHistoryEntry[]> {
  const { data, error } = await supabase.rpc('venue_customer_bookings', {
    target_venue_id: venueId,
    target_phone: phone,
  });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    dateLabel: formatDate(row.slot_start),
    courtName: row.court_name,
    amountLabel: formatRupees(row.amount),
    status: row.status,
    wasRescheduled: row.was_rescheduled,
    cancellationReason: row.cancellation_reason,
  }));
}

export async function fetchCancellationLog(venueId: string): Promise<CancellationLogEntry[]> {
  const { data, error } = await supabase.rpc('venue_cancellation_log', { target_venue_id: venueId });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    courtName: row.court_name,
    dateLabel: formatDate(row.slot_start),
    type: row.was_rescheduled ? 'rescheduled' : 'cancelled',
    reason: row.reason,
  }));
}

export async function fetchCustomerNote(venueId: string, phone: string): Promise<string> {
  const { data, error } = await supabase
    .from('customer_notes')
    .select('note')
    .eq('venue_id', venueId)
    .eq('customer_phone', phone)
    .maybeSingle();
  if (error) throw error;
  return data?.note ?? '';
}

export async function saveCustomerNote(venueId: string, phone: string, note: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('customer_notes')
    .upsert(
      { venue_id: venueId, customer_phone: phone, note, updated_by: user?.id, updated_at: new Date().toISOString() },
      { onConflict: 'venue_id,customer_phone' }
    );
  if (error) throw error;
}