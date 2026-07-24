import { supabase } from '../lib/supabase';

export type VenueRecord = {
  id: string;
  name: string;
  address: string;
  sports: string[];
  isActive: boolean;
  courtCount: number;
};

/**
 * Fetches venues owned by the currently logged-in partner.
 * RLS ("Owners can view their own venues") means this query only ever
 * returns rows the logged-in user actually owns -- there's no need (and no
 * ability) to filter by owner_id client-side; the database enforces it.
 */
export async function fetchMyVenues(): Promise<VenueRecord[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address, sports, is_active, courts(count)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    sports: v.sports ?? [],
    isActive: v.is_active,
    courtCount: v.courts?.[0]?.count ?? 0,
  }));
}

export async function createVenue(input: { name: string; address: string; sports: string[] }): Promise<VenueRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('You must be signed in to add a venue.');

  const { data, error } = await supabase
    .from('venues')
    .insert({ owner_id: user.id, name: input.name, address: input.address, sports: input.sports })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    sports: data.sports ?? [],
    isActive: data.is_active,
    courtCount: 0,
  };
}