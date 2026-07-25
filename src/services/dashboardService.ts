import { supabase } from '../lib/supabase';

export type CourtOccupancy = {
  courtId: string;
  courtName: string;
  occupancyPct: number; // 0-100, rounded
};

export type DashboardData = {
  revenueTodayLabel: string;
  revenueTodayRaw: number;
  deltaPct: number | null; // null when there's no yesterday revenue to compare against
  deltaDirection: 'up' | 'down' | 'flat';
  totalBookings: number;
  confirmedBookings: number;
  walkInBookings: number;
  cancelledBookings: number;
  courtOccupancy: CourtOccupancy[];
};

type RpcRow = {
  revenue_today: number;
  revenue_yesterday: number;
  total_bookings: number;
  confirmed_bookings: number;
  walk_in_bookings: number;
  cancelled_bookings: number;
  court_occupancy: { court_id: string; court_name: string; booked_minutes: number; available_minutes: number }[];
};

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Fetches everything the Dashboard screen needs via the get_partner_dashboard
 * RPC (see supabase/003_dashboard_support.sql) -- one round trip instead of
 * five separate queries, computed server-side. RLS scopes this to venues
 * the caller actually owns; there is no owner_id param to pass or spoof.
 */
export async function fetchDashboardData(date: Date = new Date()): Promise<DashboardData> {
  const dateStr = date.toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc('get_partner_dashboard', { p_date: dateStr });
  if (error) throw error;

  const row = data as unknown as RpcRow;

  const revenueToday = Number(row.revenue_today ?? 0);
  const revenueYesterday = Number(row.revenue_yesterday ?? 0);

  let deltaPct: number | null = null;
  let deltaDirection: 'up' | 'down' | 'flat' = 'flat';

  if (revenueYesterday > 0) {
    deltaPct = Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);
    deltaDirection = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  } else if (revenueToday > 0) {
    deltaDirection = 'up';
  }

  const courtOccupancy: CourtOccupancy[] = (row.court_occupancy ?? []).map((c) => ({
    courtId: c.court_id,
    courtName: c.court_name,
    occupancyPct: Math.min(100, Math.round((c.booked_minutes / c.available_minutes) * 100)),
  }));

  return {
    revenueTodayLabel: formatRupees(revenueToday),
    revenueTodayRaw: revenueToday,
    deltaPct,
    deltaDirection,
    totalBookings: Number(row.total_bookings ?? 0),
    confirmedBookings: Number(row.confirmed_bookings ?? 0),
    walkInBookings: Number(row.walk_in_bookings ?? 0),
    cancelledBookings: Number(row.cancelled_bookings ?? 0),
    courtOccupancy,
  };
}