export type Customer = {
  id: string;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpendLabel: string;
  lastVisitLabel: string;
  preferredSport: string;
  notes: string;
};

export const customers: Customer[] = [
  { id: 'cu1', name: 'Rohan Mehta', phone: '98xxxxxx21', totalBookings: 42, totalSpendLabel: '₹38,400', lastVisitLabel: '22 Jul 2026', preferredSport: 'Football', notes: 'Prefers evening slots on Turf 1. Usually books with a group of 8–10.' },
  { id: 'cu2', name: 'Ayesha Khan', phone: '99xxxxxx08', totalBookings: 67, totalSpendLabel: '₹52,100', lastVisitLabel: '22 Jul 2026', preferredSport: 'Badminton', notes: 'Badminton Prime member. Plays competitively, asks for well-strung rackets.' },
  { id: 'cu3', name: 'Vikram Singh', phone: '97xxxxxx45', totalBookings: 23, totalSpendLabel: '₹19,800', lastVisitLabel: '02 Jul 2026', preferredSport: 'Multi-sport', notes: 'Membership lapsed. Sensitive about court cleanliness — flagged it twice.' },
  { id: 'cu4', name: 'Priya Desai', phone: '96xxxxxx33', totalBookings: 11, totalSpendLabel: '₹21,999', lastVisitLabel: '19 Jul 2026', preferredSport: 'Multi-sport', notes: 'Annual Elite member. Books far in advance, rarely cancels.' },
  { id: 'cu5', name: 'Karan Joshi', phone: '95xxxxxx19', totalBookings: 15, totalSpendLabel: '₹14,250', lastVisitLabel: '25 Jul 2026', preferredSport: 'Badminton', notes: '' },
];

export type BookingHistoryEntry = {
  id: string;
  dateLabel: string;
  courtName: string;
  amountLabel: string;
  status: 'completed' | 'cancelled' | 'rescheduled';
};

export const bookingHistoryByCustomer: Record<string, BookingHistoryEntry[]> = {
  cu1: [
    { id: 'h1', dateLabel: '22 Jul 2026', courtName: 'Turf 1', amountLabel: '₹1,200', status: 'completed' },
    { id: 'h2', dateLabel: '15 Jul 2026', courtName: 'Turf 1', amountLabel: '₹1,200', status: 'completed' },
    { id: 'h3', dateLabel: '08 Jul 2026', courtName: 'Turf 2', amountLabel: '₹950', status: 'rescheduled' },
  ],
  cu2: [
    { id: 'h4', dateLabel: '22 Jul 2026', courtName: 'Court A', amountLabel: '₹550', status: 'completed' },
    { id: 'h5', dateLabel: '20 Jul 2026', courtName: 'Court A', amountLabel: '₹550', status: 'completed' },
    { id: 'h6', dateLabel: '11 Jul 2026', courtName: 'Court B', amountLabel: '₹400', status: 'cancelled' },
  ],
  cu3: [
    { id: 'h7', dateLabel: '02 Jul 2026', courtName: 'Turf 1', amountLabel: '₹1,200', status: 'completed' },
    { id: 'h8', dateLabel: '20 Jun 2026', courtName: 'Court A', amountLabel: '₹550', status: 'cancelled' },
  ],
  cu4: [
    { id: 'h9', dateLabel: '19 Jul 2026', courtName: 'Turf 1', amountLabel: '₹1,200', status: 'completed' },
    { id: 'h10', dateLabel: '05 Jul 2026', courtName: 'Court A', amountLabel: '₹550', status: 'completed' },
  ],
  cu5: [
    { id: 'h11', dateLabel: '25 Jul 2026', courtName: 'Court B', amountLabel: '₹400', status: 'completed' },
  ],
};

export type CancellationLogEntry = {
  id: string;
  customerName: string;
  dateLabel: string;
  courtName: string;
  type: 'cancelled' | 'rescheduled';
  reason: string;
};

export const cancellationLog: CancellationLogEntry[] = [
  { id: 'cl1', customerName: 'Ayesha Khan', dateLabel: '11 Jul 2026', courtName: 'Court B', type: 'cancelled', reason: 'Personal emergency' },
  { id: 'cl2', customerName: 'Rohan Mehta', dateLabel: '08 Jul 2026', courtName: 'Turf 2', type: 'rescheduled', reason: 'Moved to next day due to rain' },
  { id: 'cl3', customerName: 'Vikram Singh', dateLabel: '20 Jun 2026', courtName: 'Court A', type: 'cancelled', reason: 'No reason given' },
];