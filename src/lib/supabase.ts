import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * PRODUCTION NOTE:
 * This client is initialized with the ANON key only. Never import or embed
 * the service_role/secret key here or anywhere else in this app — it
 * bypasses Row Level Security entirely. All access control for this app
 * must be enforced through RLS policies (see /supabase/schema.sql),
 * not by trusting what the client sends.
 *
 * TYPING NOTE:
 * This client is untyped (no <Database> generic) rather than using the
 * hand-written database.types.ts — supabase-js's generic constraints are
 * strict enough that an approximate, hand-authored Database type causes
 * more friction than it's worth. Once the schema is live, regenerate real
 * types with the Supabase CLI (command is in database.types.ts) and add
 * `createClient<Database>(...)` back for full query type-safety.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});