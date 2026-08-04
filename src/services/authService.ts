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
 * Creates the auth user. The matching `profiles` row is created
 * server-side by a Postgres trigger (see
 * supabase/migrations/006_fix_handle_new_user.sql -> handle_new_user())
 * that fires on auth.users insert and reads these fields back out of
 * raw_user_meta_data. This avoids a client-side insert racing against RLS
 * when email confirmation is enabled and no session exists yet right
 * after signUp().
 *
 * role: 'partner' must be sent explicitly -- this project's Supabase
 * instance is shared with the JustPlay Consumer app, whose signups use
 * the same trigger and default to role: 'customer' when unspecified.
 */
export async function signUpPartner(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: 'partner',
        full_name: input.fullName,
        organisation_name: input.organisationName,
        phone: input.phone,
        location: input.location,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign up did not return a user. Please try again.');

  await acceptPendingStaffInvitations();

  return data;
}

export async function signIn(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;

  await acceptPendingStaffInvitations();

  return data;
}

/**
 * Links any pending staff invitations for this account's email to real
 * venue_staff rows. Safe to call on every sign-in/sign-up -- it's a no-op
 * if there's nothing pending. See accept_my_staff_invitations() in
 * supabase/schema.sql for why this has to be a client-triggered RPC call
 * rather than something that "just happens" server-side: there's no
 * service-role backend here to push it proactively.
 */
async function acceptPendingStaffInvitations() {
  try {
    await supabase.rpc('accept_my_staff_invitations');
  } catch {
    // Non-fatal -- if this fails, the user just won't see their staff
    // assignment until the next successful sign-in. Don't block auth on it.
  }
}

/**
 * Sign the user out.
 *
 * Uses `scope: 'local'` on purpose. The default `signOut()` scope is
 * 'global', which calls Supabase's API to revoke the refresh token
 * server-side *before* it clears the session that's persisted in
 * AsyncStorage. If that network call fails or hangs (flaky connection,
 * an already-expired/invalid token, backgrounded app, etc.) the promise
 * rejects, the local session is never cleared, `onAuthStateChange` in
 * App.tsx never fires, and the UI just... stays on the Profile screen --
 * which is exactly the "Log out button does nothing" symptom. 'local'
 * clears the on-device session immediately without waiting on that round
 * trip, so the SIGNED_OUT event always fires and the app reliably swaps
 * to AuthNavigator.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}