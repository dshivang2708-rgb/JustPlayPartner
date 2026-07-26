// supabase/functions/send-marketing-campaign/index.ts
//
// Deploy with:
//   supabase functions deploy send-marketing-campaign
//
// No gateway secrets needed for this one -- Expo's push API doesn't require
// a secret key for basic sending. (Optional: set EXPO_ACCESS_TOKEN as a
// secret and it'll be used if you've enabled Expo's enhanced push security.)
//
// Flow:
//   1. Client creates a `notification_campaigns` row directly (status='draft')
//      -- normal RLS applies, so this only succeeds if the caller can
//      manage marketing for that venue.
//   2. Client calls this function with { campaignId }.
//   3. This function re-fetches the campaign using the CALLER's own JWT
//      (so RLS -- and therefore authorization -- is re-checked
//      independently, not just trusted from step 1), computes the exact
//      same audience the "N customers match" preview showed (same RPC,
//      same permission check), then uses the service-role key only for
//      the actual fan-out writes and the Expo API call.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN'); // optional

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100; // Expo's own documented per-request limit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ message: 'Missing Authorization header.' }, 401);

    const { campaignId } = await req.json();
    if (!campaignId) return jsonResponse({ message: 'campaignId is required.' }, 400);

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: campaign, error: campaignError } = await supabaseUser
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // RLS means this only returns a row if the caller can actually manage
    // marketing for this campaign's venue -- a not-found here IS the
    // authorization failure, not just a missing row.
    if (campaignError || !campaign) {
      return jsonResponse({ message: 'Campaign not found, or you do not have permission to send it.' }, 404);
    }

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return jsonResponse({ message: `This campaign is already ${campaign.status}.` }, 409);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabaseAdmin.from('notification_campaigns').update({ status: 'sending' }).eq('id', campaignId);

    // Same RPC, same permission check, called via the user's own client --
    // this is guaranteed to be the identical query the "N customers match"
    // preview in the app already showed before Send was tapped.
    const { data: audience, error: audienceError } = await supabaseUser.rpc('venue_marketing_audience', {
      target_venue_id: campaign.venue_id,
      filter_sport: campaign.filter_sport,
      filter_min_total_spend: campaign.filter_min_total_spend,
      filter_min_total_bookings: campaign.filter_min_total_bookings,
      filter_inactive_days: campaign.filter_inactive_days,
    });

    if (audienceError) {
      await markFailed(supabaseAdmin, campaignId, audienceError.message);
      return jsonResponse({ message: audienceError.message }, 500);
    }

    const customerIds: string[] = (audience ?? []).map((row: any) => row.customer_id);

    if (customerIds.length === 0) {
      await supabaseAdmin
        .from('notification_campaigns')
        .update({ status: 'sent', recipient_count: 0, sent_at: new Date().toISOString() })
        .eq('id', campaignId);
      return jsonResponse({ recipientCount: 0, pushSent: 0, pushFailed: 0 });
    }

    const channels: string[] = campaign.channels ?? [];

    if (channels.includes('in_app')) {
      const rows = customerIds.map((customerId) => ({
        customer_id: customerId,
        venue_id: campaign.venue_id,
        campaign_id: campaignId,
        title: campaign.title,
        body: campaign.body,
      }));
      const { error: insertError } = await supabaseAdmin.from('notifications').insert(rows);
      if (insertError) {
        await markFailed(supabaseAdmin, campaignId, insertError.message);
        return jsonResponse({ message: insertError.message }, 500);
      }
    }

    let pushSent = 0;
    let pushFailed = 0;

    if (channels.includes('push')) {
      const { data: tokenRows, error: tokenError } = await supabaseAdmin
        .from('push_tokens')
        .select('expo_push_token')
        .in('customer_id', customerIds);

      if (tokenError) {
        // Non-fatal for the whole campaign -- in-app notifications (if
        // selected) already went out above; log and continue.
        console.error('Failed to fetch push tokens', tokenError);
      } else {
        const tokens = (tokenRows ?? []).map((r) => r.expo_push_token);
        const result = await sendExpoPushBatches(tokens, campaign.title, campaign.body);
        pushSent = result.sent;
        pushFailed = result.failed;
      }
    }

    await supabaseAdmin
      .from('notification_campaigns')
      .update({ status: 'sent', recipient_count: customerIds.length, sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    return jsonResponse({ recipientCount: customerIds.length, pushSent, pushFailed });
  } catch (e) {
    console.error('Unexpected error in send-marketing-campaign', e);
    return jsonResponse({ message: 'Unexpected server error.' }, 500);
  }
});

async function markFailed(supabaseAdmin: ReturnType<typeof createClient>, campaignId: string, reason: string) {
  await supabaseAdmin
    .from('notification_campaigns')
    .update({ status: 'failed', failure_reason: reason })
    .eq('id', campaignId);
}

async function sendExpoPushBatches(
  tokens: string[],
  title: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map((token) => ({ to: token, title, body, sound: 'default' }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          ...(EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(messages),
      });
      const body_ = await res.json();
      const tickets = body_?.data ?? [];
      for (const ticket of tickets) {
        if (ticket.status === 'ok') sent += 1;
        else failed += 1;
      }
    } catch (e) {
      console.error('Expo push batch failed', e);
      failed += batch.length;
    }
  }

  return { sent, failed };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}