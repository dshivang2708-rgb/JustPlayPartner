export type EngineMode = 'Manual' | 'Assisted' | 'Auto';

export type CourtPricing = {
  courtId: string;
  courtName: string;
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
  floor: number; // absolute slider bounds
  ceiling: number;
};

export const courtPricing: CourtPricing[] = [
  { courtId: 'c1', courtName: 'Turf 1 — Football', minPrice: 900, maxPrice: 1600, currentPrice: 1200, floor: 500, ceiling: 2500 },
  { courtId: 'c2', courtName: 'Turf 2 — Football', minPrice: 700, maxPrice: 1400, currentPrice: 950, floor: 500, ceiling: 2500 },
  { courtId: 'c3', courtName: 'Court A — Badminton', minPrice: 350, maxPrice: 700, currentPrice: 550, floor: 200, ceiling: 1200 },
  { courtId: 'c4', courtName: 'Court B — Badminton', minPrice: 300, maxPrice: 600, currentPrice: 400, floor: 200, ceiling: 1200 },
];

export type PriceChangeEntry = {
  id: string;
  dateLabel: string;
  courtName: string;
  fromPrice: number;
  toPrice: number;
  revenueImpactLabel: string;
  revenueImpactUp: boolean;
  triggeredBy: 'Manual' | 'Assisted' | 'Auto';
};

export const priceChangeHistory: PriceChangeEntry[] = [
  { id: 'pc1', dateLabel: '20 Jul 2026', courtName: 'Turf 1 — Football', fromPrice: 1100, toPrice: 1200, revenueImpactLabel: '+₹4,800/mo', revenueImpactUp: true, triggeredBy: 'Assisted' },
  { id: 'pc2', dateLabel: '14 Jul 2026', courtName: 'Court A — Badminton', fromPrice: 500, toPrice: 550, revenueImpactLabel: '+₹1,650/mo', revenueImpactUp: true, triggeredBy: 'Manual' },
  { id: 'pc3', dateLabel: '02 Jul 2026', courtName: 'Turf 2 — Football', fromPrice: 1050, toPrice: 950, revenueImpactLabel: '+₹2,300/mo', revenueImpactUp: true, triggeredBy: 'Assisted' },
  { id: 'pc4', dateLabel: '25 Jun 2026', courtName: 'Court B — Badminton', fromPrice: 450, toPrice: 400, revenueImpactLabel: '−₹300/mo', revenueImpactUp: false, triggeredBy: 'Manual' },
];