export type SlotStatus = 'booked' | 'available' | 'blocked';

export type Slot = {
  time: string; // e.g. "06:00 AM"
  status: SlotStatus;
  customerName?: string;
};

export const bookingCourts = [
  { key: 'c1', label: 'Turf 1' },
  { key: 'c2', label: 'Turf 2' },
  { key: 'c3', label: 'Court A' },
  { key: 'c4', label: 'Court B' },
  { key: 'c5', label: 'Box Cricket' },
];

export const dateChips = [
  { key: 'today', label: 'Today, 22 Jul' },
  { key: 'tomorrow', label: 'Tomorrow, 23 Jul' },
  { key: 'd2', label: 'Thu, 24 Jul' },
  { key: 'd3', label: 'Fri, 25 Jul' },
  { key: 'd4', label: 'Sat, 26 Jul' },
];

const HOURLY_TIMES = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
];

const STATUS_CYCLE: SlotStatus[] = ['booked', 'booked', 'available', 'available', 'available', 'blocked'];
const SAMPLE_NAMES = ['Rohan M.', 'Ayesha K.', 'Vikram S.', 'Priya D.', 'Karan J.'];

/** Deterministic mock slot grid so the same court/date always shows the same demo data. */
export function getSlotsFor(courtKey: string, dateKey: string): Slot[] {
  const seed = courtKey.length + dateKey.length;
  return HOURLY_TIMES.map((time, i) => {
    const status = STATUS_CYCLE[(i + seed) % STATUS_CYCLE.length];
    return {
      time,
      status,
      customerName: status === 'booked' ? SAMPLE_NAMES[(i + seed) % SAMPLE_NAMES.length] : undefined,
    };
  });
}

export const recurringRules = [
  { id: 'r1', court: 'Turf 1', days: 'Mon–Fri', time: '06:00 AM – 08:00 AM', label: 'Morning academy block' },
  { id: 'r2', court: 'Court A', days: 'Every Sun', time: '05:00 PM – 09:00 PM', label: 'Weekend tournament hold' },
];