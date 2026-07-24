export type SuggestionStatus = 'active' | 'applied' | 'dismissed' | 'snoozed';

export type Suggestion = {
  id: string;
  title: string;
  detail: string;
  expectedImpactLabel: string;
  whyTrail: string[];
  status: SuggestionStatus;
};

export const initialSuggestions: Suggestion[] = [
  {
    id: 'sg1',
    title: 'Lower Turf 2 weekday morning price by 15%',
    detail: 'Weekday 6–9 AM slots on Turf 2 have stayed under 30% occupancy for three straight months while Turf 1 books out. A modest discount could pull overflow demand from Turf 1.',
    expectedImpactLabel: '+₹6,200/month',
    whyTrail: [
      'Turf 2 morning occupancy: 28% avg (last 90 days)',
      'Turf 1 morning occupancy: 84% avg — regularly turning away bookings',
      'Similar 10–15% discounts on comparable venues lifted off-peak bookings by ~22%',
    ],
    status: 'active',
  },
  {
    id: 'sg2',
    title: 'Send renewal reminders to 5 expiring memberships',
    detail: '5 members on Badminton Prime renew within the next 7 days and haven\'t opened your last two broadcast messages. A direct WhatsApp nudge tends to convert better than in-app alerts alone.',
    expectedImpactLabel: '+₹9,495 at risk',
    whyTrail: [
      '5 members with renewal dates between 24–29 Jul 2026',
      'None have opened the last 2 broadcast notifications',
      'Historical renewal rate without a nudge: 61% vs. 84% with one',
    ],
    status: 'active',
  },
  {
    id: 'sg3',
    title: 'Restock shuttlecocks and table tennis paddles this week',
    detail: 'Two equipment items are below their low-stock threshold and both are attached to weekend bookings, which see your highest rental attach-rate.',
    expectedImpactLabel: '+₹2,100/month',
    whyTrail: [
      'Shuttlecock (tube): 4 in stock, threshold 6',
      'Table Tennis Paddle: 2 in stock, threshold 4',
      'Weekend rental attach-rate: 41% vs. 22% on weekdays',
    ],
    status: 'active',
  },
  {
    id: 'sg4',
    title: 'Add a Sunday evening recurring hold for Court A',
    detail: 'Court A books out every Sunday 5–9 PM organically, but you\'re not currently blocking it as a guaranteed hold, risking accidental overlap with walk-ins.',
    expectedImpactLabel: 'Prevents ~2 double-bookings/month',
    whyTrail: [
      'Court A Sunday 5–9 PM booked in 11 of the last 12 weeks',
      '2 double-booking conflicts logged in the last 30 days, both on Sundays',
    ],
    status: 'active',
  },
];