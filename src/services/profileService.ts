import { supabase } from '../lib/supabase';

export type ProfileRecord = {
  id: string;
  fullName: string;
  email: string;
  organisationName: string;
  phone: string;
  location: string;
  joinedLabel: string;
};

function formatJoinedLabel(createdAtIso: string): string {
  const date = new Date(createdAtIso);
  return `Partner since ${date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

/**
 * Fetches the logged-in partner's profile. Email comes from Supabase Auth
 * (auth.users), not the `profiles` table -- profiles never stores email,
 * so this is the only place that reads it. Everything else comes from the
 * `profiles` row created at signup by the handle_new_user() trigger.
 */
export async function fetchMyProfile(): Promise<ProfileRecord> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to view your profile.');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, organisation_name, phone, location, created_at')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fullName: data.full_name,
    email: user.email ?? '',
    organisationName: data.organisation_name ?? '',
    phone: data.phone ?? '',
    location: data.location ?? '',
    joinedLabel: formatJoinedLabel(data.created_at),
  };
}

/**
 * Updates editable profile fields. RLS ("Users can update their own
 * profile") already restricts this to auth.uid() = id -- no explicit
 * owner filter needed here, the database enforces it.
 */
export async function updateMyProfile(updates: {
  fullName: string;
  organisationName: string;
  phone: string;
  location: string;
}): Promise<ProfileRecord> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to update your profile.');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      organisation_name: updates.organisationName,
      phone: updates.phone,
      location: updates.location,
    })
    .eq('id', user.id)
    .select('id, full_name, organisation_name, phone, location, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fullName: data.full_name,
    email: user.email ?? '',
    organisationName: data.organisation_name ?? '',
    phone: data.phone ?? '',
    location: data.location ?? '',
    joinedLabel: formatJoinedLabel(data.created_at),
  };
}