import { supabase } from '../lib/supabase';

export type EventStatus = 'upcoming' | 'past' | 'pending';

export type EventRecord = {
  id: string;
  title: string;
  venueId: string;
  venueName: string;
  dateLabel: string;
  status: EventStatus;
  participantsLabel: string;
};

const DATE_LABEL_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };

/** Derives display status from event_date + is_pending -- never trust a stored 'past' value, since that would go stale the moment the date passes. */
function deriveStatus(eventDateIso: string, isPending: boolean): EventStatus {
  if (isPending) return 'pending';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventDateIso);
  return eventDate.getTime() < today.getTime() ? 'past' : 'upcoming';
}

/**
 * Fetches events for venues owned by the currently logged-in partner.
 * RLS ("Venue owners can manage their events") scopes this to the
 * logged-in user's own venues automatically -- no client-side owner filter
 * needed or possible.
 */
export async function fetchMyEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, participants_label, is_pending, venues(id, name)')
    .order('event_date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    venueId: e.venues?.id ?? '',
    venueName: e.venues?.name ?? 'Unknown venue',
    dateLabel: new Date(e.event_date).toLocaleDateString('en-IN', DATE_LABEL_FORMAT),
    status: deriveStatus(e.event_date, e.is_pending),
    participantsLabel: e.participants_label || 'No participants listed yet',
  }));
}

export async function createEvent(input: {
  venueId: string;
  title: string;
  eventDate: string; // 'YYYY-MM-DD'
  participantsLabel?: string;
  isPending?: boolean;
}): Promise<EventRecord> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      venue_id: input.venueId,
      title: input.title,
      event_date: input.eventDate,
      participants_label: input.participantsLabel ?? '',
      is_pending: input.isPending ?? false,
    })
    .select('id, title, event_date, participants_label, is_pending, venues(id, name)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    venueId: (data as any).venues?.id ?? input.venueId,
    venueName: (data as any).venues?.name ?? '',
    dateLabel: new Date(data.event_date).toLocaleDateString('en-IN', DATE_LABEL_FORMAT),
    status: deriveStatus(data.event_date, data.is_pending),
    participantsLabel: data.participants_label || 'No participants listed yet',
  };
}