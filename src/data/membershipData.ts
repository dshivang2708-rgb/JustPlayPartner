export type MembershipPlan = {
  id: string;
  name: string;
  priceLabel: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  memberCount: number;
  sport: string;
};

export const membershipPlans: MembershipPlan[] = [
  { id: 'p1', name: 'Turf Unlimited', priceLabel: '₹2,499', billingCycle: 'Monthly', memberCount: 42, sport: 'Football' },
  { id: 'p2', name: 'Badminton Prime', priceLabel: '₹1,899', billingCycle: 'Monthly', memberCount: 67, sport: 'Badminton' },
  { id: 'p3', name: 'Weekend Warrior', priceLabel: '₹6,999', billingCycle: 'Quarterly', memberCount: 23, sport: 'Multi-sport' },
  { id: 'p4', name: 'Annual Elite', priceLabel: '₹21,999', billingCycle: 'Yearly', memberCount: 11, sport: 'Multi-sport' },
];

export type RenewalStatus = 'active' | 'expiring' | 'lapsed';

export type Member = {
  id: string;
  name: string;
  phone: string;
  planName: string;
  renewalDate: string;
  status: RenewalStatus;
};

export const members: Member[] = [
  { id: 'm1', name: 'Rohan Mehta', phone: '98xxxxxx21', planName: 'Turf Unlimited', renewalDate: '14 Aug 2026', status: 'active' },
  { id: 'm2', name: 'Ayesha Khan', phone: '99xxxxxx08', planName: 'Badminton Prime', renewalDate: '27 Jul 2026', status: 'expiring' },
  { id: 'm3', name: 'Vikram Singh', phone: '97xxxxxx45', planName: 'Weekend Warrior', renewalDate: '02 Jul 2026', status: 'lapsed' },
  { id: 'm4', name: 'Priya Desai', phone: '96xxxxxx33', planName: 'Annual Elite', renewalDate: '19 Jan 2027', status: 'active' },
  { id: 'm5', name: 'Karan Joshi', phone: '95xxxxxx19', planName: 'Badminton Prime', renewalDate: '25 Jul 2026', status: 'expiring' },
  { id: 'm6', name: 'Neha Kapoor', phone: '94xxxxxx77', planName: 'Turf Unlimited', renewalDate: '30 Jun 2026', status: 'lapsed' },
];

export const STATUS_FILTERS: { key: RenewalStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All members' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring soon' },
  { key: 'lapsed', label: 'Lapsed' },
];