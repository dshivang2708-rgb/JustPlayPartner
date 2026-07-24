export type ComparisonMetric = {
  label: string;
  todayValue: string;
  deltaPct: number; // positive = up vs last week
};

export const comparisonMetrics: ComparisonMetric[] = [
  { label: 'Revenue', todayValue: '₹28,450', deltaPct: 12 },
  { label: 'Bookings', todayValue: '34', deltaPct: 8 },
  { label: 'Occupancy', todayValue: '71%', deltaPct: -4 },
  { label: 'New customers', todayValue: '9', deltaPct: 21 },
];

// Peak-hour heatmap: rows = days, cols = 2-hour blocks from 6 AM to 10 PM.
export const heatmapHours = ['6-8', '8-10', '10-12', '12-2', '2-4', '4-6', '6-8', '8-10'];
export const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// 0-100 occupancy intensity per [day][hourBlock]
export const heatmapData: number[][] = [
  [20, 15, 30, 45, 40, 70, 90, 60],
  [18, 12, 28, 42, 38, 65, 85, 55],
  [22, 18, 32, 48, 42, 72, 92, 62],
  [25, 20, 35, 50, 45, 75, 95, 65],
  [30, 25, 40, 55, 60, 85, 98, 80],
  [45, 50, 65, 70, 75, 92, 100, 88],
  [40, 45, 60, 68, 72, 88, 96, 78],
];

// Revenue trend — last 7 days, in rupees
export const revenueTrend = [
  { label: 'Wed', value: 21200 },
  { label: 'Thu', value: 24800 },
  { label: 'Fri', value: 26100 },
  { label: 'Sat', value: 31500 },
  { label: 'Sun', value: 29800 },
  { label: 'Mon', value: 22400 },
  { label: 'Tue', value: 28450 },
];

export const repeatRate = {
  repeatPct: 64,
  newPct: 36,
};