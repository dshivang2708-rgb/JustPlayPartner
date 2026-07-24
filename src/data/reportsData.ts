export type ReportPeriod = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

export type ReportBreakdownStat = {
  label: string;
  value: string;
  deltaPct: number;
};

export type GeneratedReport = {
  id: string;
  period: ReportPeriod;
  periodLabel: string; // e.g. "June 2026"
  generatedDateLabel: string;
  breakdown: ReportBreakdownStat[];
  wins: string[];
  problems: string[];
};

export const generatedReports: GeneratedReport[] = [
  {
    id: 'r_jun26',
    period: 'Monthly',
    periodLabel: 'June 2026',
    generatedDateLabel: '01 Jul 2026',
    breakdown: [
      { label: 'Revenue', value: '₹6,84,200', deltaPct: 14 },
      { label: 'Occupancy', value: '68%', deltaPct: 6 },
      { label: 'Booking volume', value: '842', deltaPct: 9 },
    ],
    wins: [
      'Evening slots (6–9 PM) hit 92% average occupancy, up from 81% last month.',
      'Badminton Prime membership plan added 14 new members, the strongest plan this month.',
      'Walk-in cancellations dropped to 3%, down from 7% — the new confirmation SMS is working.',
    ],
    problems: [
      'Weekday mornings (6–9 AM) stayed under 30% occupancy for the third month running.',
      'Turf 2 generated 22% less revenue than Turf 1 despite similar slot availability.',
      '11 payment links expired unused — customers may be dropping off before completing payment.',
    ],
  },
  {
    id: 'r_may26',
    period: 'Monthly',
    periodLabel: 'May 2026',
    generatedDateLabel: '01 Jun 2026',
    breakdown: [
      { label: 'Revenue', value: '₹5,99,850', deltaPct: 4 },
      { label: 'Occupancy', value: '64%', deltaPct: 2 },
      { label: 'Booking volume', value: '771', deltaPct: 3 },
    ],
    wins: [
      'First month membership revenue crossed ₹1 lakh, driven by Annual Elite renewals.',
      'Weekend occupancy stayed above 85% for all four weekends.',
      'Equipment rental attach-rate on bookings rose to 31%, up from 24%.',
    ],
    problems: [
      'Court B (Badminton) occupancy fell to 38%, the lowest of any court this month.',
      'GST invoice generation lagged behind transactions by up to 3 days.',
      'Cancellation rate on phone bookings (9%) remained higher than app bookings (2%).',
    ],
  },
  {
    id: 'r_q2_26',
    period: 'Quarterly',
    periodLabel: 'Q2 2026 (Apr–Jun)',
    generatedDateLabel: '02 Jul 2026',
    breakdown: [
      { label: 'Revenue', value: '₹19,42,600', deltaPct: 11 },
      { label: 'Occupancy', value: '66%', deltaPct: 5 },
      { label: 'Booking volume', value: '2,410', deltaPct: 8 },
    ],
    wins: [
      'Membership plans now account for 34% of total revenue, up from 21% in Q1.',
      'Average booking value rose to ₹805, up from ₹742 last quarter.',
      'Repeat customer rate improved to 61%, a quarter-over-quarter high.',
    ],
    problems: [
      'Weekday morning occupancy remains structurally low across all three months.',
      'Staff scheduling gaps caused 6 flagged front-desk coverage issues in June.',
      'Two courts (Turf 2, Court B) consistently underperform the venue average.',
    ],
  },
];

export const REPORT_PERIODS: ReportPeriod[] = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];