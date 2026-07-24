export type Court = {
  id: string;
  name: string;
  sport: string;
  occupancyPct: number; // 0-100, today
};

export const courts: Court[] = [
  { id: 'c1', name: 'Turf 1 — Football', sport: 'Football', occupancyPct: 88 },
  { id: 'c2', name: 'Turf 2 — Football', sport: 'Football', occupancyPct: 62 },
  { id: 'c3', name: 'Court A — Badminton', sport: 'Badminton', occupancyPct: 95 },
  { id: 'c4', name: 'Court B — Badminton', sport: 'Badminton', occupancyPct: 41 },
  { id: 'c5', name: 'Box Cricket Net', sport: 'Cricket', occupancyPct: 70 },
];

export type BookingSummary = {
  totalToday: number;
  confirmed: number;
  walkIns: number;
  cancelled: number;
};

export const bookingSummary: BookingSummary = {
  totalToday: 34,
  confirmed: 29,
  walkIns: 5,
  cancelled: 2,
};

export const revenueToday = {
  amount: '₹28,450',
  deltaLabel: '12% vs yesterday',
  deltaDirection: 'up' as const,
};
