import { supabase } from '../lib/supabase';

export type ComparisonMetric = {
  label: string;
  todayValue: string;
  deltaPct: number;
};

export type AnalyticsData = {
  comparisonMetrics: ComparisonMetric[];
  heatmapDays: string[];
  heatmapHours: string[];
  heatmapData: number[][];
  revenueTrend: { label: string; value: number }[];
  repeatRate: { repeatPct: number; newPct: number };
};

type HeatmapCell = { day_offset: number; block_index: number; booked_minutes: number; available_minutes: number };

type RpcRow = {
  revenue_today: number;
  revenue_last_week: number;
  bookings_today: number;
  bookings_last_week: number;
  occupancy_today_pct: number;
  occupancy_last_week_pct: number;
  new_customers_today: number;
  new_customers_last_week: number;
  repeat_pct: number;
  revenue_trend: { date: string; value: number }[];
  heatmap: HeatmapCell[];
};

const HOUR_BLOCK_LABELS = ['6-8', '8-10', '10-12', '12-2', '2-4', '4-6', '6-8', '8-10'];

function pctDelta(today: number, lastWeek: number): number {
  if (lastWeek <= 0) return today > 0 ? 100 : 0;
  return Math.round(((today - lastWeek) / lastWeek) * 100);
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function dayLabelFromOffset(baseDate: Date, offset: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - (6 - offset));
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

/**
 * Fetches everything the Analytics screen needs via the get_partner_analytics
 * RPC (see supabase/007_analytics_support.sql), then reshapes it into the
 * exact prop shapes TrendLineChart / HeatmapGrid / DonutChart already expect
 * -- so the screen and chart components below don't need to change, only
 * where the data comes from.
 */
export async function fetchAnalyticsData(date: Date = new Date()): Promise<AnalyticsData> {
  const dateStr = date.toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc('get_partner_analytics', { p_date: dateStr });
  if (error) throw new Error(error.message);

  const row = data as unknown as RpcRow;

  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Revenue',
      todayValue: formatRupees(Number(row.revenue_today ?? 0)),
      deltaPct: pctDelta(Number(row.revenue_today ?? 0), Number(row.revenue_last_week ?? 0)),
    },
    {
      label: 'Bookings',
      todayValue: String(row.bookings_today ?? 0),
      deltaPct: pctDelta(Number(row.bookings_today ?? 0), Number(row.bookings_last_week ?? 0)),
    },
    {
      label: 'Occupancy',
      todayValue: `${Math.round(row.occupancy_today_pct ?? 0)}%`,
      deltaPct: pctDelta(Number(row.occupancy_today_pct ?? 0), Number(row.occupancy_last_week_pct ?? 0)),
    },
    {
      label: 'New customers',
      todayValue: String(row.new_customers_today ?? 0),
      deltaPct: pctDelta(Number(row.new_customers_today ?? 0), Number(row.new_customers_last_week ?? 0)),
    },
  ];

  const revenueTrend = (row.revenue_trend ?? []).map((r) => ({
    label: new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    value: Number(r.value),
  }));

  const heatmapData: number[][] = Array.from({ length: 7 }, () => Array(8).fill(0));
  for (const cell of row.heatmap ?? []) {
    const pct = Math.min(100, Math.round((cell.booked_minutes / cell.available_minutes) * 100));
    if (heatmapData[cell.day_offset]) heatmapData[cell.day_offset][cell.block_index] = pct;
  }
  const heatmapDays = Array.from({ length: 7 }, (_, i) => dayLabelFromOffset(date, i));

  return {
    comparisonMetrics,
    heatmapDays,
    heatmapHours: HOUR_BLOCK_LABELS,
    heatmapData,
    revenueTrend,
    repeatRate: {
      repeatPct: Number(row.repeat_pct ?? 0),
      newPct: 100 - Number(row.repeat_pct ?? 0),
    },
  };
}