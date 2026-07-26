import { supabase } from '../lib/supabase';
import { GeneratedReport, ReportPeriod } from '../data/reportsData';

type PeriodRange = {
  label: string;
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPeriodRange(period: ReportPeriod, today: Date = new Date()): PeriodRange {
  const y = today.getFullYear();
  const m = today.getMonth();

  if (period === 'Monthly') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    const prevStart = new Date(y, m - 1, 1);
    const prevEnd = start;
    return {
      label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      start: toDateStr(start),
      end: toDateStr(end),
      prevStart: toDateStr(prevStart),
      prevEnd: toDateStr(prevEnd),
    };
  }

  if (period === 'Quarterly') {
    const qIndex = Math.floor(m / 3);
    const start = new Date(y, qIndex * 3, 1);
    const end = new Date(y, qIndex * 3 + 3, 1);
    const prevStart = new Date(y, qIndex * 3 - 3, 1);
    const prevEnd = start;
    const monthNames = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
    return {
      label: `Q${qIndex + 1} ${y} (${monthNames[qIndex]})`,
      start: toDateStr(start),
      end: toDateStr(end),
      prevStart: toDateStr(prevStart),
      prevEnd: toDateStr(prevEnd),
    };
  }

  if (period === 'Half-Yearly') {
    const isH1 = m < 6;
    const start = new Date(y, isH1 ? 0 : 6, 1);
    const end = new Date(y, isH1 ? 6 : 12, 1);
    const prevStart = new Date(y, isH1 ? -6 : 0, 1);
    const prevEnd = start;
    return {
      label: `${isH1 ? 'H1' : 'H2'} ${y} (${isH1 ? 'Jan–Jun' : 'Jul–Dec'})`,
      start: toDateStr(start),
      end: toDateStr(end),
      prevStart: toDateStr(prevStart),
      prevEnd: toDateStr(prevEnd),
    };
  }

  const start = new Date(y, 0, 1);
  const end = new Date(y + 1, 0, 1);
  const prevStart = new Date(y - 1, 0, 1);
  const prevEnd = start;
  return {
    label: String(y),
    start: toDateStr(start),
    end: toDateStr(end),
    prevStart: toDateStr(prevStart),
    prevEnd: toDateStr(prevEnd),
  };
}

type PeriodStats = {
  revenue: number;
  booking_volume: number;
  occupancy_pct: number;
  cancellation_pct: number;
  top_court_name: string | null;
  weakest_court_name: string | null;
};

async function computePeriodStats(start: string, end: string): Promise<PeriodStats> {
  const { data, error } = await supabase.rpc('compute_period_stats', { p_start: start, p_end: end });
  if (error) throw new Error(error.message);
  return data as unknown as PeriodStats;
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildNarrative(current: PeriodStats, previous: PeriodStats): { wins: string[]; problems: string[] } {
  const wins: string[] = [];
  const problems: string[] = [];

  const revenueDelta = pctChange(current.revenue, previous.revenue);
  const bookingDelta = pctChange(current.booking_volume, previous.booking_volume);
  const occupancyDelta = current.occupancy_pct - previous.occupancy_pct;
  const cancellationDelta = current.cancellation_pct - previous.cancellation_pct;

  if (revenueDelta > 0) wins.push(`Revenue grew ${revenueDelta}% compared to the previous period.`);
  else if (revenueDelta < 0) problems.push(`Revenue fell ${Math.abs(revenueDelta)}% compared to the previous period.`);

  if (bookingDelta > 0) wins.push(`Booking volume increased ${bookingDelta}%, with ${current.booking_volume} total bookings.`);
  else if (bookingDelta < 0) problems.push(`Booking volume dropped ${Math.abs(bookingDelta)}% compared to the previous period.`);

  if (current.top_court_name) wins.push(`${current.top_court_name} was the top-performing court by revenue this period.`);

  if (occupancyDelta > 0) wins.push(`Overall occupancy improved by ${occupancyDelta.toFixed(1)} percentage points.`);
  else if (occupancyDelta < -2) problems.push(`Occupancy dropped by ${Math.abs(occupancyDelta).toFixed(1)} percentage points.`);

  if (current.weakest_court_name) problems.push(`${current.weakest_court_name} had the lowest occupancy of any court this period.`);

  if (cancellationDelta > 2) problems.push(`Cancellation rate rose to ${current.cancellation_pct}%, up ${cancellationDelta.toFixed(1)} points.`);
  else if (current.cancellation_pct < 5) wins.push(`Cancellation rate stayed low at ${current.cancellation_pct}%.`);

  const padWins = wins.length > 0 ? wins : ['No standout wins this period yet.'];
  const padProblems = problems.length > 0 ? problems : ['No significant problem areas detected this period.'];
  return { wins: padWins.slice(0, 3), problems: padProblems.slice(0, 3) };
}

function formatRupees(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function toGeneratedReport(row: any): GeneratedReport {
  return {
    id: row.id,
    period: row.period,
    periodLabel: row.period_label,
    generatedDateLabel: new Date(row.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    breakdown: [
      { label: 'Revenue', value: formatRupees(row.revenue), deltaPct: pctChange(row.revenue, row.revenue_prev) },
      { label: 'Occupancy', value: `${row.occupancy_pct}%`, deltaPct: Math.round(row.occupancy_pct - row.occupancy_prev_pct) },
      { label: 'Booking volume', value: String(row.booking_volume), deltaPct: pctChange(row.booking_volume, row.booking_volume_prev) },
    ],
    wins: row.wins ?? [],
    problems: row.problems ?? [],
  };
}

export async function fetchReports(period: ReportPeriod): Promise<GeneratedReport[]> {
  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('period', period)
    .order('period_start', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toGeneratedReport);
}

export async function fetchReportById(id: string): Promise<GeneratedReport | null> {
  const { data, error } = await supabase.from('generated_reports').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toGeneratedReport(data) : null;
}

export async function generateReport(period: ReportPeriod): Promise<GeneratedReport> {
  const range = getPeriodRange(period);
  const [current, previous] = await Promise.all([
    computePeriodStats(range.start, range.end),
    computePeriodStats(range.prevStart, range.prevEnd),
  ]);

  const narrative = buildNarrative(current, previous);

  const { data, error } = await supabase
    .from('generated_reports')
    .insert({
      period,
      period_label: range.label,
      period_start: range.start,
      period_end: range.end,
      revenue: current.revenue,
      revenue_prev: previous.revenue,
      booking_volume: current.booking_volume,
      booking_volume_prev: previous.booking_volume,
      occupancy_pct: current.occupancy_pct,
      occupancy_prev_pct: previous.occupancy_pct,
      cancellation_pct: current.cancellation_pct,
      cancellation_prev_pct: previous.cancellation_pct,
      top_court_name: current.top_court_name,
      weakest_court_name: current.weakest_court_name,
      wins: narrative.wins,
      problems: narrative.problems,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toGeneratedReport(data);
}