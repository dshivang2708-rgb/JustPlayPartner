export type Coupon = {
  id: string;
  code: string;
  description: string;
  discountLabel: string;
  usedCount: number;
  expiryLabel: string;
  active: boolean;
};

export const coupons: Coupon[] = [
  { id: 'cp1', code: 'WEEKEND20', description: 'Weekend bookings — Turf 1 & 2', discountLabel: '20% off', usedCount: 34, expiryLabel: 'Expires 31 Jul 2026', active: true },
  { id: 'cp2', code: 'FIRSTGAME', description: 'First-time customers, any court', discountLabel: '₹100 off', usedCount: 61, expiryLabel: 'No expiry', active: true },
  { id: 'cp3', code: 'MORNING15', description: 'Weekday mornings, 6–9 AM', discountLabel: '15% off', usedCount: 8, expiryLabel: 'Expires 15 Aug 2026', active: true },
  { id: 'cp4', code: 'MONSOON10', description: 'Indoor courts only', discountLabel: '10% off', usedCount: 47, expiryLabel: 'Expired 30 Jun 2026', active: false },
];

export const microsite = {
  venueName: 'Sunrise Sports Arena',
  publicUrl: 'justplay.app/sunrise-sports-arena',
  viewsThisMonth: 1284,
  lastUpdatedLabel: 'Updated 3 days ago',
};

export type BroadcastMessage = {
  id: string;
  message: string;
  audienceLabel: string;
  sentDateLabel: string;
  channel: 'In-App' | 'SMS' | 'WhatsApp';
  recipientCount: number;
};

export const recentBroadcasts: BroadcastMessage[] = [
  { id: 'bc1', message: 'Monsoon offer live — 10% off all indoor courts this week!', audienceLabel: 'All customers', sentDateLabel: '18 Jul 2026', channel: 'WhatsApp', recipientCount: 412 },
  { id: 'bc2', message: 'Your Badminton Prime membership renews in 3 days.', audienceLabel: 'Expiring members', sentDateLabel: '15 Jul 2026', channel: 'SMS', recipientCount: 5 },
];