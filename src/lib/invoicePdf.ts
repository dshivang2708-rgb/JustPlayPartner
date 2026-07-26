import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { GstInvoice } from '../services/paymentsService';

/**
 * Renders an HTML invoice to a real PDF file and opens the native
 * share/save sheet. This is fully client-side (via expo-print, which wraps
 * the platform's own PDF renderer) -- no backend needed for this part.
 *
 * Requires: npx expo install expo-print expo-sharing
 */
export async function generateAndShareInvoicePdf(
  invoice: GstInvoice,
  venue: { name: string; address: string; gstin?: string }
) {
  const html = buildInvoiceHtml(invoice, venue);
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Invoice ${invoice.invoiceNo}`,
    });
  }
  return uri;
}

function buildInvoiceHtml(invoice: GstInvoice, venue: { name: string; address: string; gstin?: string }): string {
  const issuedDate = new Date(invoice.createdAtIso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1A1A; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .venue-name { font-size: 20px; font-weight: 700; margin: 0; }
          .venue-address { font-size: 12px; color: #555; margin-top: 4px; max-width: 280px; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 22px; margin: 0; color: #8A6A2E; }
          .invoice-title p { font-size: 12px; color: #555; margin: 2px 0 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { text-align: left; padding: 10px 8px; font-size: 13px; }
          th { background: #F5F1E8; color: #555; font-weight: 600; border-bottom: 1px solid #E2DCC8; }
          td { border-bottom: 1px solid #EEE; }
          .amount-cell { text-align: right; }
          .totals { margin-top: 16px; width: 100%; }
          .totals td { border: none; padding: 4px 8px; font-size: 13px; }
          .totals .label { text-align: right; color: #555; }
          .totals .value { text-align: right; width: 120px; font-weight: 600; }
          .grand-total .value { font-size: 16px; color: #8A6A2E; }
          .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <p class="venue-name">${escapeHtml(venue.name)}</p>
            <p class="venue-address">${escapeHtml(venue.address)}</p>
            ${venue.gstin ? `<p class="venue-address">GSTIN: ${escapeHtml(venue.gstin)}</p>` : ''}
          </div>
          <div class="invoice-title">
            <h1>TAX INVOICE</h1>
            <p>${escapeHtml(invoice.invoiceNo)}</p>
            <p>${issuedDate}</p>
          </div>
        </div>

        <p><strong>Billed to:</strong> ${escapeHtml(invoice.customerName)}</p>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount-cell">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Booking / venue services</td>
              <td class="amount-cell">₹${invoice.baseAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>GST</td>
              <td class="amount-cell">₹${invoice.gstAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table class="totals">
          <tr class="grand-total">
            <td class="label">Total (paid)</td>
            <td class="value">₹${invoice.totalAmount.toFixed(2)}</td>
          </tr>
        </table>

        <p class="footer">This is a system-generated invoice.</p>
      </body>
    </html>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}