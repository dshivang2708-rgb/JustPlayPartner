/**
 * Payments API service layer.
 *
 * Payment link creation happens in the create-payment-link Supabase Edge
 * Function (supabase/functions/create-payment-link/index.ts) -- that's
 * where the Razorpay secret key actually lives, never in this app. This
 * file just calls that function via supabase.functions.invoke(), which
 * automatically attaches the signed-in partner's session token so the
 * function can re-verify they're allowed to act on the venue in question.
 *
 * Status updates (success/failed/refunded) are NEVER written by this app --
 * they only ever come from razorpay-webhook/index.ts after verifying the
 * gateway's signature. See that file for why a client-side "payment done"
 * callback is never trusted as the source of truth.
 *
 * MOCK_MODE stays on until you've:
 *   1. Deployed both Edge Functions (see their file headers for the exact
 *      `supabase functions deploy` commands)
 *   2. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
 *      as Supabase secrets
 *   3. Added the webhook URL in the Razorpay Dashboard
 * Flip it to false only after all three are done and tested with a real
 * (or Razorpay test-mode) payment.
 */

import { supabase } from '../lib/supabase';

const MOCK_MODE = true;

export type CreatePaymentLinkRequest = {
  venueId: string;
  amountInPaise: number; // always send integer paise, never rupee floats
  customerName: string;
  customerPhone: string;
  description: string;
};

export type CreatePaymentLinkResponse = {
  paymentLinkId: string;
  shortUrl: string;
  status: 'created';
};

export class PaymentsApiError extends Error {}

export async function createPaymentLink(req: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> {
  if (req.amountInPaise <= 0) {
    throw new PaymentsApiError('Amount must be greater than zero.');
  }
  if (!req.customerPhone || req.customerPhone.replace(/\D/g, '').length < 10) {
    throw new PaymentsApiError('Enter a valid 10-digit phone number.');
  }
  if (!req.venueId) {
    throw new PaymentsApiError('Select a venue first.');
  }

  if (MOCK_MODE) {
    // Simulates network latency so loading states can be tested honestly.
    await new Promise((resolve) => setTimeout(resolve, 900));
    const mockId = `plink_${Math.random().toString(36).slice(2, 10)}`;
    return {
      paymentLinkId: mockId,
      shortUrl: `https://rzp.io/i/${mockId}`,
      status: 'created',
    };
  }

  const { data, error } = await supabase.functions.invoke('create-payment-link', {
    body: {
      venueId: req.venueId,
      amountInRupees: req.amountInPaise / 100,
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      description: req.description,
    },
  });

  if (error) {
    // supabase-js surfaces non-2xx function responses as a generic error;
    // the function's own JSON message body is more useful when available.
    const message = (error as any)?.context?.body?.message ?? error.message ?? 'Payment link creation failed.';
    throw new PaymentsApiError(message);
  }

  return data as CreatePaymentLinkResponse;
}

/** Converts a rupee string/number input into integer paise, safely. */
export function rupeesToPaise(rupees: string | number): number {
  const value = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}