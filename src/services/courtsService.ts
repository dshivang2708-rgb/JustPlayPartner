import { supabase } from '../lib/supabase';

export type CourtRecord = {
  id: string;
  venueId: string;
  name: string;
  sport: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  openingTime: string; // 'HH:MM:SS'
  closingTime: string; // 'HH:MM:SS'
  isActive: boolean;
  imageUrl: string | null;
};

function mapCourt(row: any): CourtRecord {
  return {
    id: row.id,
    venueId: row.venue_id,
    name: row.name,
    sport: row.sport,
    basePrice: Number(row.base_price),
    minPrice: Number(row.min_price),
    maxPrice: Number(row.max_price),
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    isActive: row.is_active,
    imageUrl: row.image_url ?? null,
  };
}

/**
 * Fetches every court (turf) for a venue -- including inactive ones, since
 * this is for the owner's own management screen, not the consumer app's
 * public listing (which only ever sees is_active = true courts of
 * is_active = true venues, per RLS).
 */
export async function fetchCourtsForVenue(venueId: string): Promise<CourtRecord[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCourt);
}

export type CourtInput = {
  name: string;
  sport: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  openingTime: string;
  closingTime: string;
};

export async function createCourt(venueId: string, input: CourtInput): Promise<CourtRecord> {
  const { data, error } = await supabase
    .from('courts')
    .insert({
      venue_id: venueId,
      name: input.name,
      sport: input.sport,
      base_price: input.basePrice,
      min_price: input.minPrice,
      max_price: input.maxPrice,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCourt(data);
}

export async function updateCourt(
  id: string,
  input: CourtInput & { isActive: boolean }
): Promise<CourtRecord> {
  const { data, error } = await supabase
    .from('courts')
    .update({
      name: input.name,
      sport: input.sport,
      base_price: input.basePrice,
      min_price: input.minPrice,
      max_price: input.maxPrice,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      is_active: input.isActive,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapCourt(data);
}

/**
 * Deliberately NOT a hard delete. Courts are referenced by `bookings` (and
 * transitively by `payments`, `equipment_rentals`) -- deleting one out from
 * under historical bookings would either fail the foreign key or, worse,
 * silently orphan financial records. Deactivating (is_active = false) hides
 * it from the consumer app and from new-booking flows while keeping
 * booking/payment history intact. This mirrors how `venues.is_active`
 * already works.
 */
export async function setCourtActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('courts').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}