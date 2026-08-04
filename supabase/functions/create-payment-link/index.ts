// supabase/functions/create-payment-link/index.ts
//
// Deploy with:
//   supabase functions deploy create-payment-link
//
// Required secrets (set once, never committed):
//   supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxx
//   supabase secrets set RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
//   supabase secrets set GST_RATE_PERCENT=18   (optional -- see note below)
//
// This function is the ONLY place the Razorpay secret key exists. The app
// never sees it -- it calls this function via supabase.functions.invoke(),
// authenticated with the partner's own session token, and this function
// re-validates that they're actually allowed to create a payment link for
// the venue they specified before touching Razorpay or the database.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
// GST TREATMENT NOTE: this assumes the amount entered is GST-inclusive and
// splits it out for the invoice using a flat rate. Confirm the correct rate
// and inclusive/exclusive treatment for your registration with your CA --
// this is a reasonable MVP default, not tax advice.
const GST_RATE_PERCENT = Number(Deno.env.get('GST_RATE_PERCENT') ?? '18');

// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// auto-injected into every Supabase Edge Function's environment already --
// never hardcode the actual URL/keys here. (This line was previously
// passing the literal secret values as the *variable name* argument to
// Deno.env.get(), which both broke the function and leaked the keys into
// the repo. If those keys were ever pushed anywhere, rotate them in
// Supabase Dashboard -> Project Settings -> API immediately.)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type RequestBody = {
  venueId: string;
  amountInRupees: number;
  customerName: string;
  customerPhone: string;
  description?: string;
  bookingId?: string; // set by the consumer app when paying for a specific booking
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ message: 'Missing Authorization header.' }, 401);
    }

    const body: RequestBody = await req.json();
    const { venueId, amountInRupees, customerName, customerPhone, bookingId } = body;
    const description = body.description?.trim() || `Booking payment — ${customerName?.trim() || 'Guest'}`;

    if (!venueId) return jsonResponse({ message: 'venueId is required.' }, 400);
    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return jsonResponse({ message: 'Amount must be greater than zero.' }, 400);
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      return jsonResponse({ message: 'Enter a valid 10-digit phone number.' }, 400);
    }

    // Client scoped to the caller's own JWT -- respects RLS, so this can
    // only ever see what the caller is actually allowed to see. We use it
    // purely to check authorization, never to write.
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ message: 'Invalid or expired session.' }, 401);

    // Two valid callers:
    //  1. Partner app: the venue's owner/staff, creating a manual payment
    //     link for a walk-in/phone booking (no bookingId).
    //  2. Consumer app: the customer who owns the booking they're paying
    //     for (bookingId supplied, and it must be their own booking).
    const authorized = bookingId
      ? await isAuthorizedForBooking(supabaseUser, bookingId, venueId, user.id)
      : await isAuthorizedForVenue(supabaseUser, venueId, user.id);

    if (!authorized) {
      return jsonResponse({ message: "You don't have permission to create a payment link for this." }, 403);
    }

    // Admin client, service-role key -- bypasses RLS. Used ONLY for the
    // insert below, after we've already independently verified authorization
    // above using the caller's own restricted client.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const amountInPaise = Math.round(amountInRupees * 100);
    const baseAmount = round2(amountInRupees / (1 + GST_RATE_PERCENT / 100));
    const gstAmount = round2(amountInRupees - baseAmount);

    const razorpayRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        description,
        customer: {
          name: customerName?.trim() || undefined,
          contact: normalizePhone(customerPhone),
        },
        notify: { sms: true, email: false },
        reminder_enable: true,
        notes: { venue_id: venueId, created_by: user.id, booking_id: bookingId ?? '' },
      }),
    });

    const razorpayBody = await razorpayRes.json();
    if (!razorpayRes.ok) {
      console.error('Razorpay payment link creation failed', razorpayBody);
      return jsonResponse(
        { message: razorpayBody?.error?.description ?? 'Payment gateway rejected this request.' },
        502
      );
    }

    const { error: insertError, data: inserted } = await supabaseAdmin
      .from('payments')
      .insert({
        venue_id: venueId,
        booking_id: bookingId ?? null,
        amount: amountInRupees,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        method: 'UPI', // placeholder until the webhook reports the method actually used
        status: 'pending',
        customer_name: customerName?.trim() || null,
        customer_phone: normalizePhone(customerPhone),
        description,
        gateway_payment_link_id: razorpayBody.id,
        payment_link_url: razorpayBody.short_url,
        created_by: user.id,
      })
      .select('id, invoice_number')
      .single();

    if (insertError) {
      console.error('Failed to record pending payment after Razorpay link creation', insertError);
      return jsonResponse(
        { message: 'The payment link was created but could not be recorded. Contact support with this reference: ' + razorpayBody.id },
        500
      );
    }

    return jsonResponse({
      paymentId: inserted.id,
      invoiceNumber: inserted.invoice_number,
      paymentLinkId: razorpayBody.id,
      shortUrl: razorpayBody.short_url,
      status: 'created',
    });
  } catch (e) {
    console.error('Unexpected error in create-payment-link', e);
    return jsonResponse({ message: 'Unexpected server error.' }, 500);
  }
});

async function isAuthorizedForBooking(
  supabaseUser: ReturnType<typeof createClient>,
  bookingId: string,
  venueId: string,
  userId: string
): Promise<boolean> {
  // "Customers can view their own bookings" RLS policy means this only
  // returns a row if the booking both exists AND belongs to this caller --
  // it can't be used to probe other people's bookings.
  const { data: booking } = await supabaseUser
    .from('bookings')
    .select('id, customer_id, court_id, courts!inner(venue_id)')
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .maybeSingle();

  if (!booking) return false;
  return (booking as any).courts?.venue_id === venueId;
}

async function isAuthorizedForVenue(
  supabaseUser: ReturnType<typeof createClient>,
  venueId: string,
  userId: string
): Promise<boolean> {
  const { data: venue } = await supabaseUser.from('venues').select('owner_id').eq('id', venueId).maybeSingle();
  if (venue?.owner_id === userId) return true;

  const { data: staffRow } = await supabaseUser
    .from('venue_staff')
    .select('permissions')
    .eq('venue_id', venueId)
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(staffRow?.permissions?.includes('Manage bookings'));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : phone;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}