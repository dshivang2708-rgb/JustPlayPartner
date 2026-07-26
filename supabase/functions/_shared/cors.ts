// Shared across Edge Functions. The webhook function doesn't strictly need
// CORS (Razorpay calls it server-to-server), but create-payment-link is
// called from the app, including from Expo's web bundler in dev, where
// browser CORS rules do apply.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};