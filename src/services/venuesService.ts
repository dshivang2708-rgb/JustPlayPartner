import { supabase } from '../lib/supabase';

export type VenueRecord = {
  id: string;
  name: string;
  address: string;
  sports: string[];
  isActive: boolean;
  courtCount: number;
  coverImageUrls: string[];
};

const SELECT_COLUMNS = 'id, name, address, sports, is_active, cover_image_urls, courts(count)';

function mapVenue(row: any): VenueRecord {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    sports: row.sports ?? [],
    isActive: row.is_active,
    courtCount: row.courts?.[0]?.count ?? 0,
    coverImageUrls: row.cover_image_urls ?? [],
  };
}

/**
 * Fetches venues owned by the currently logged-in partner.
 * RLS ("Owners can view their own venues") means this query only ever
 * returns rows the logged-in user actually owns -- there's no need (and no
 * ability) to filter by owner_id client-side; the database enforces it.
 */
export async function fetchMyVenues(): Promise<VenueRecord[]> {
  const { data, error } = await supabase.from('venues').select(SELECT_COLUMNS).order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapVenue);
}

export async function fetchVenueById(id: string): Promise<VenueRecord> {
  const { data, error } = await supabase.from('venues').select(SELECT_COLUMNS).eq('id', id).single();

  if (error) throw error;
  return mapVenue(data);
}

export async function createVenue(input: { name: string; address: string; sports: string[] }): Promise<VenueRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('You must be signed in to add a venue.');

  const { data, error } = await supabase
    .from('venues')
    .insert({ owner_id: user.id, name: input.name, address: input.address, sports: input.sports })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return mapVenue(data);
}

/**
 * Edits an existing venue. RLS ("Owners can update their own venues") means
 * this silently affects zero rows if the caller doesn't own it -- Supabase
 * won't error, so treat an unexpectedly-empty result as a real error too.
 */
export async function updateVenue(
  id: string,
  input: { name: string; address: string; sports: string[]; isActive: boolean }
): Promise<VenueRecord> {
  const { data, error } = await supabase
    .from('venues')
    .update({ name: input.name, address: input.address, sports: input.sports, is_active: input.isActive })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return mapVenue(data);
}