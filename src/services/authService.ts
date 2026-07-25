import { supabase } from '../lib/supabase';

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  organisationName: string;
  phone: string;
  location: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

/**
 * Creates the auth user. The matching `profiles` row (role='partner') is
 * created server-side by a Postgres trigger (see
 * supabase/schema.sql -> handle_new_user()) that fires on auth.users
 * insert and reads these fields back out of raw_user_meta_data. This
 * avoids a client-side insert racing against RLS when email confirmation
 * is enabled and no session exists yet right after signUp().
 */
export async function signUpPartner(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        organisation_name: input.organisationName,
        phone: input.phone,
        location: input.location,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign up did not return a user. Please try again.');

  return data;
}

export async function signIn(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}