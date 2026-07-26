import { supabase } from '../lib/supabase';
import { Slot, SlotStatus } from '../data/bookingData';

export type CourtOption = {
  id: string;
  name: string;
  sport: string;
  basePrice: number;
  openingTime: string;
  closingTime: string;
};

/** All active courts across every venue the logged-in partner owns. */
export async function fetchCourts(): Promise<CourtOption[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('id, name, sport, base_price, opening_time, closing_time, is_active, venues!inner(owner_id)')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    sport: c.sport,
    basePrice: Number(c.base_price),
    openingTime: c.opening_time,
    closingTime: c.closing_time,
  }));
}

type BookingRow = {
  id: string;
  customer_name: string;
  slot_range: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  is_blocked: boolean;
};

function parseRangeBounds(range: string): { start: Date; end: Date } {
  const cleaned = range.replace(/[\[\]()"]/g, '');
  const [startStr, endStr] = cleaned.split(',');
  return { start: new Date(startStr), end: new Date(endStr) };
}

function hourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 || hour === 24 ? 'AM' : 'PM';
  return `${String(h).padStart(2, '0')}:00 ${suffix}`;
}

export type DaySlot = Slot & { bookingId?: string };

/**
 * Builds the full hourly slot grid for a court on a given day by combining
 * the court's opening/closing hours with whatever real bookings exist for
 * that day -- this replaces the old getSlotsFor() mock generator entirely.
 */
export async function fetchDaySlots(court: CourtOption, dateStr: string): Promise<DaySlot[]> {
  const nextDay = new Date(`${dateStr}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDayStr = nextDay.toISOString().slice(0, 10);

  // slot_range is a Postgres range type (tstzrange) -- you can't compare it
  // to a plain timestamp with gte/lte (that's a type error in Postgres).
  // The correct comparison is range overlap ("&&"), which PostgREST exposes
  // as the 'ov' filter operator. This asks: "which bookings' slot_range
  // overlaps today's [00:00, next day 00:00) window?"
  const dayRange = `[${dateStr}T00:00:00,${nextDayStr}T00:00:00)`;

  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_name, slot_range, status, is_blocked')
    .eq('court_id', court.id)
    .neq('status', 'cancelled')
    .filter('slot_range', 'ov', dayRange);

  if (error) throw new Error(error.message);

  const bookings = (data ?? []) as BookingRow[];
  const openHour = parseInt(court.openingTime.slice(0, 2), 10);
  const closeHour = parseInt(court.closingTime.slice(0, 2), 10);

  const slots: DaySlot[] = [];
  for (let hour = openHour; hour < closeHour; hour++) {
    const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);
    const match = bookings.find((b) => {
      const { start } = parseRangeBounds(b.slot_range);
      return start.getHours() === slotStart.getHours() && start.getDate() === slotStart.getDate();
    });

    let status: SlotStatus = 'available';
    let customerName: string | undefined;
    if (match) {
      status = match.is_blocked ? 'blocked' : 'booked';
      customerName = match.is_blocked ? undefined : match.customer_name;
    }

    slots.push({ time: hourLabel(hour), status, customerName, bookingId: match?.id });
  }

  return slots;
}

function buildSlotRange(dateStr: string, hour: number): string {
  const start = `${dateStr} ${String(hour).padStart(2, '0')}:00:00`;
  const end = `${dateStr} ${String(hour + 1).padStart(2, '0')}:00:00`;
  return `[${start},${end})`;
}

export class BookingConflictError extends Error {}

async function insertBooking(row: {
  court_id: string;
  customer_name: string;
  customer_phone?: string;
  slot_range: string;
  amount: number;
  source: 'app' | 'walk_in' | 'phone' | 'blocked';
  is_blocked?: boolean;
}) {
  const { error } = await supabase.from('bookings').insert(row);
  if (error) {
    if (error.code === '23P01') {
      throw new BookingConflictError('This slot was just taken. Please pick another time.');
    }
    throw new Error(error.message);
  }
}

export async function createWalkInBooking(input: {
  courtId: string;
  dateStr: string;
  hour: number;
  customerName: string;
  customerPhone: string;
  amount: number;
  source: 'walk_in' | 'phone';
}) {
  await insertBooking({
    court_id: input.courtId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    slot_range: buildSlotRange(input.dateStr, input.hour),
    amount: input.amount,
    source: input.source,
  });
}

export async function blockSlot(courtId: string, dateStr: string, hour: number) {
  await insertBooking({
    court_id: courtId,
    customer_name: 'Blocked by venue',
    slot_range: buildSlotRange(dateStr, hour),
    amount: 0,
    source: 'blocked',
    is_blocked: true,
  });
}

/** Unblocking and cancelling are the same operation -- mark cancelled
 * rather than deleting, so the slot history stays intact. */
export async function cancelBooking(bookingId: string) {
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (error) throw new Error(error.message);
}

export type RecurringRule = {
  id: string;
  courtId: string;
  courtName: string;
  label: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
};

export async function fetchRecurringRules(): Promise<RecurringRule[]> {
  const { data, error } = await supabase
    .from('recurring_slot_rules')
    .select('id, court_id, label, days_of_week, start_time, end_time, courts(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    courtId: r.court_id,
    courtName: r.courts?.name ?? 'Unknown court',
    label: r.label,
    daysOfWeek: r.days_of_week ?? [],
    startTime: r.start_time,
    endTime: r.end_time,
  }));
}

export async function createRecurringRule(input: {
  courtId: string;
  label: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}) {
  const { error } = await supabase.from('recurring_slot_rules').insert({
    court_id: input.courtId,
    label: input.label,
    days_of_week: input.daysOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
  });
  if (error) throw new Error(error.message);
}

export async function deleteRecurringRule(id: string) {
  const { error } = await supabase.from('recurring_slot_rules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}