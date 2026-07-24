/**
 * Payments API service layer.
 *
 * PRODUCTION NOTE — read before wiring a real backend:
 * Payment link creation must happen on YOUR backend, never in this app.
 * The mobile client should only ever call your own API (e.g.
 * `POST /api/venues/:id/payment-links`), and your backend is what holds the
 * Razorpay/Stripe secret key and calls their server-side API
 * (e.g. Razorpay's `/v1/payment_links` endpoint) using it.
 *
 * Never:
 *  - Embed a payment gateway secret key in this app's source or env config
 *    bundled into the client — anything shipped to a phone is extractable.
 *  - Trust an amount or status sent from the client as truth — always
 *    re-verify against the gateway's webhook payload server-side.
 *  - Mark a booking "paid" from a client-side success callback alone —
 *    treat webhooks (with signature verification) as the source of truth,
 *    since a client can be closed, killed, or spoofed mid-flow.
 *  - Process a webhook twice — use the gateway's event ID as an idempotency
 *    key so retried webhook deliveries don't double-credit a transaction.
 *
 * This file models the client's contract with your backend. It currently
 * returns mock data so the UI is fully testable before your backend exists;
 * swap MOCK_MODE to false once the endpoints below are live.
 */

const MOCK_MODE = true;
const API_BASE_URL = 'https://api.yourdomain.com'; // replace with your real backend URL

export type CreatePaymentLinkRequest = {
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

export async function createPaymentLink(
  req: CreatePaymentLinkRequest
): Promise<CreatePaymentLinkResponse> {
  if (req.amountInPaise <= 0) {
    throw new PaymentsApiError('Amount must be greater than zero.');
  }
  if (!req.customerPhone || req.customerPhone.replace(/\D/g, '').length < 10) {
    throw new PaymentsApiError('Enter a valid 10-digit phone number.');
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

  const res = await fetch(`${API_BASE_URL}/api/payment-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new PaymentsApiError(body?.message ?? `Payment link creation failed (${res.status}).`);
  }

  return res.json();
}

/** Converts a rupee string/number input into integer paise, safely. */
export function rupeesToPaise(rupees: string | number): number {
  const value = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}