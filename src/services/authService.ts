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
 * Creates the auth user, then creates the matching row in `profiles` with
 * role='partner'. If the profile insert fails after the auth user is
 * created, we surface a clear error rather than leaving a silently
 * incomplete account -- in a real production build you'd want this pair
 * done inside a Postgres function (RPC) so it's atomic, rather than two
 * separate client calls.
 */
export async function signUpPartner(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign up did not return a user. Please try again.');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    role: 'partner',
    full_name: input.fullName,
    organisation_name: input.organisationName,
    phone: input.phone,
    location: input.location,
  });

  if (profileError) {
    throw new Error(
      `Account created, but your profile details couldn't be saved (${profileError.message}). Please contact support.`
    );
  }

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