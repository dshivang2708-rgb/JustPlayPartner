// supabase/functions/razorpay-webhook/index.ts
//
// Deploy with (note --no-verify-jwt -- Razorpay calls this directly, it has
// no Supabase session/JWT to present, so we verify authenticity via the
// HMAC signature below instead):
//   supabase functions deploy razorpay-webhook --no-verify-jwt
//
// Then in the Razorpay Dashboard -> Settings -> Webhooks, add:
//   URL:    https://<your-project-ref>.functions.supabase.co/razorpay-webhook
//   Secret: (generate one, then also set it below)
//   Events: payment_link.paid, payment.captured, payment.failed,
//           refund.created, refund.processed
//
// Required secret:
//   supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx
//
// PRODUCTION PRINCIPLE: this webhook is the ONLY thing that ever marks a
// payment success/failed/refunded. The client-side "payment success"
// callback some gateways offer is not trusted here -- a closed app, a
// killed process, or a spoofed client callback can't be trusted, but a
// signed server-to-server webhook can.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
// Auto-injected by Supabase into every Edge Function -- do not hardcode.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('X-Razorpay-Signature');

  if (!signatureHeader || !(await isValidSignature(rawBody, signatureHeader))) {
    console.error('Razorpay webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotency: dedupe by a hash of the exact raw body. Razorpay retries
  // webhook deliveries on any non-2xx/timeout, and a retried delivery has
  // byte-identical content, so this reliably catches repeats regardless of
  // whether a given payload includes its own unique event id.
  const eventHash = await sha256Hex(rawBody);
  const { error: dedupeError } = await supabaseAdmin
    .from('payment_webhook_events')
    .insert({ gateway_event_id: eventHash });

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      // Already processed this exact delivery -- acknowledge and stop.
      return new Response('OK (already processed)', { status: 200 });
    }
    console.error('Failed to record webhook event for idempotency', dedupeError);
    return new Response('Internal error', { status: 500 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  try {
    await handleEvent(supabaseAdmin, payload);
  } catch (e) {
    // Log and still return 200 -- once the event is recorded as processed
    // above, returning a non-2xx would just cause Razorpay to retry a
    // delivery we've already deduped away, permanently losing this event.
    // Business-logic failures here need alerting/monitoring, not a retry.
    console.error('Error while applying webhook event', e);
  }

  return new Response('OK', { status: 200 });
});

async function handleEvent(supabaseAdmin: ReturnType<typeof createClient>, payload: any) {
  const event: string = payload.event;

  switch (event) {
    case 'payment_link.paid':
    case 'payment.captured': {
      const paymentEntity = payload.payload?.payment?.entity;
      const linkEntity = payload.payload?.payment_link?.entity;
      const linkId = linkEntity?.id ?? paymentEntity?.notes?.payment_link_id;

      if (!linkId) {
        console.error('Could not resolve payment_link id from captured/paid event', payload);
        return;
      }

      await supabaseAdmin
        .from('payments')
        .update({
          status: 'success',
          gateway_payment_id: paymentEntity?.id ?? null,
          method: mapRazorpayMethod(paymentEntity?.method),
        })
        .eq('gateway_payment_link_id', linkId);
      return;
    }

    case 'payment.failed': {
      const paymentEntity = payload.payload?.payment?.entity;
      const linkId = paymentEntity?.notes?.payment_link_id;
      if (!linkId) return;

      const { data: updatedPayment } = await supabaseAdmin
        .from('payments')
        .update({ status: 'failed', gateway_payment_id: paymentEntity?.id ?? null })
        .eq('gateway_payment_link_id', linkId)
        .select('booking_id')
        .maybeSingle();

      // Consumer-app online bookings reserve the slot immediately (via the
      // exclusion constraint) at the moment the customer confirms their
      // selection, before payment completes. If payment then fails, that
      // reservation must be released -- otherwise the slot stays locked
      // forever for a booking nobody actually paid for.
      if (updatedPayment?.booking_id) {
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'cancelled', cancellation_reason: 'Payment failed' })
          .eq('id', updatedPayment.booking_id)
          .eq('status', 'confirmed');
      }
      return;
    }

    case 'refund.created':
    case 'refund.processed': {
      const refundEntity = payload.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (!paymentId) return;

      await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('gateway_payment_id', paymentId);
      return;
    }

    default:
      // Unhandled event type -- fine to ignore silently; Razorpay sends
      // many event types this app doesn't need to act on.
      return;
  }
}

function mapRazorpayMethod(method?: string): 'UPI' | 'Card' | 'Cash' | 'Netbanking' {
  switch (method) {
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    case 'netbanking':
      return 'Netbanking';
    default:
      return 'UPI';
  }
}

async function isValidSignature(rawBody: string, signatureHeader: string): Promise<boolean> {
  const expected = await hmacSha256Hex(RAZORPAY_WEBHOOK_SECRET, rawBody);
  return timingSafeEqual(expected, signatureHeader);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(new Uint8Array(signature));
}

async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}