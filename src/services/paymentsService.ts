import { supabase } from '../lib/supabase';

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Netbanking';
export type TransactionStatus = 'success' | 'pending' | 'failed' | 'refunded';

export type Transaction = {
  id: string;
  dateLabel: string;
  customerName: string;
  amountLabel: string;
  method: PaymentMethod;
  status: TransactionStatus;
};

export type GstInvoice = {
  id: string;
  invoiceNo: string;
  periodLabel: string;
  amountLabel: string;
  gstAmountLabel: string;
  // Kept as raw values too (not just display labels) since the PDF
  // generator needs real numbers, not pre-formatted strings.
  customerName: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  createdAtIso: string;
};

export type Reconciliation = {
  grossCollectedLabel: string;
  refundedLabel: string;
  netSettledLabel: string;
};

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export async function fetchTransactionsForVenue(venueId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, created_at, customer_name, amount, method, status')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    dateLabel: formatDateLabel(row.created_at),
    customerName: row.customer_name || 'Guest',
    amountLabel: formatRupees(Number(row.amount)),
    method: row.method as PaymentMethod,
    status: row.status as TransactionStatus,
  }));
}

/** Only successful payments get treated as issued GST invoices. */
export async function fetchInvoicesForVenue(venueId: string): Promise<GstInvoice[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, invoice_number, created_at, customer_name, amount, base_amount, gst_amount')
    .eq('venue_id', venueId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    invoiceNo: row.invoice_number,
    periodLabel: new Date(row.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    amountLabel: formatRupees(Number(row.amount)),
    gstAmountLabel: formatRupees(Number(row.gst_amount ?? 0)),
    customerName: row.customer_name || 'Guest',
    baseAmount: Number(row.base_amount ?? 0),
    gstAmount: Number(row.gst_amount ?? 0),
    totalAmount: Number(row.amount),
    createdAtIso: row.created_at,
  }));
}

/**
 * Server-side aggregate via the venue_payment_totals() SQL function (see
 * payments_migration.sql) -- runs with the caller's own privileges, so the
 * "Owners and permitted staff can view payments" RLS policy still applies.
 *
 * Note: platform/gateway fees aren't tracked yet -- that needs ingesting
 * Razorpay's Settlements API/webhooks, which isn't wired up here. Net shown
 * is gross minus refunds only; it will run slightly ahead of what actually
 * lands in the bank account once gateway fees are accounted for.
 */
export async function fetchReconciliationForVenue(venueId: string): Promise<Reconciliation> {
  const { data, error } = await supabase.rpc('venue_payment_totals', { target_venue_id: venueId }).single();
  if (error) throw error;

  const row = data as { gross_amount: number; refunded_amount: number; net_amount: number };
  return {
    grossCollectedLabel: formatRupees(Number(row.gross_amount)),
    refundedLabel: formatRupees(Number(row.refunded_amount)),
    netSettledLabel: formatRupees(Number(row.net_amount)),
  };
}