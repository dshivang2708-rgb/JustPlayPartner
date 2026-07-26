import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Share, Alert, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { ChipRow } from '../components/ChipRow';
import { TransactionRow } from '../components/TransactionRow';
import { InvoiceRow } from '../components/InvoiceRow';
import { color, font, radius, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import {
  fetchTransactionsForVenue,
  fetchInvoicesForVenue,
  fetchReconciliationForVenue,
  Transaction,
  GstInvoice,
  Reconciliation,
} from '../services/paymentsService';
import { createPaymentLink, rupeesToPaise, PaymentsApiError } from '../services/paymentsApi';
import { generateAndShareInvoicePdf } from '../lib/invoicePdf';

const LIST_MODES = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'invoices', label: 'GST invoices' },
];

export function PaymentsScreen() {
  const [listMode, setListMode] = useState('transactions');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<GstInvoice[]>([]);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setVenuesLoading(true);
      try {
        const data = await fetchMyVenues();
        setVenues(data);
        setSelectedVenueId((prev) => prev ?? data[0]?.id ?? null);
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, []);

  const loadVenueData = useCallback(async (venueId: string) => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [txns, invs, recon] = await Promise.all([
        fetchTransactionsForVenue(venueId),
        fetchInvoicesForVenue(venueId),
        fetchReconciliationForVenue(venueId),
      ]);
      setTransactions(txns);
      setInvoices(invs);
      setReconciliation(recon);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Could not load payments.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) loadVenueData(selectedVenueId);
  }, [selectedVenueId, loadVenueData]);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const handleDownload = async (invoice: GstInvoice) => {
    if (!selectedVenue) return;
    setDownloadingId(invoice.id);
    try {
      await generateAndShareInvoicePdf(invoice, { name: selectedVenue.name, address: selectedVenue.address });
    } catch (e) {
      Alert.alert('Could not generate invoice', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ScreenScaffold title="Payments" subtitle={selectedVenue ? selectedVenue.name : 'Accounting & reconciliation'}>
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first — payments are tracked per venue.</Text>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <ChipRow
              chips={venues.map((v) => ({ key: v.id, label: v.name }))}
              selectedKey={selectedVenueId ?? venues[0].id}
              onSelect={setSelectedVenueId}
            />
          )}

          {dataLoading ? (
            <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
          ) : dataError ? (
            <Card>
              <Text style={styles.errorText}>{dataError}</Text>
              <Button
                label="Retry"
                variant="secondary"
                size="sm"
                onPress={() => selectedVenueId && loadVenueData(selectedVenueId)}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ) : (
            <>
              {reconciliation && <ReconciliationCard reconciliation={reconciliation} />}
              {selectedVenueId && (
                <PaymentLinkGenerator
                  venueId={selectedVenueId}
                  onCreated={() => loadVenueData(selectedVenueId)}
                />
              )}

              <SegmentedControl options={LIST_MODES} selectedKey={listMode} onChange={setListMode} />

              {listMode === 'transactions' && (
                <Card padded={false}>
                  <View style={{ padding: spacing.md }}>
                    {transactions.length === 0 ? (
                      <Text style={styles.emptyText}>No transactions yet.</Text>
                    ) : (
                      transactions.map((t) => <TransactionRow key={t.id} txn={t} />)
                    )}
                  </View>
                </Card>
              )}

              {listMode === 'invoices' && (
                <Card padded={false}>
                  <View style={{ padding: spacing.md }}>
                    {invoices.length === 0 ? (
                      <Text style={styles.emptyText}>No GST invoices yet — these appear once a payment succeeds.</Text>
                    ) : (
                      invoices.map((inv) => (
                        <InvoiceRow
                          key={inv.id}
                          invoice={inv}
                          downloading={downloadingId === inv.id}
                          onDownload={() => handleDownload(inv)}
                        />
                      ))
                    )}
                  </View>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </ScreenScaffold>
  );
}

function ReconciliationCard({ reconciliation }: { reconciliation: Reconciliation }) {
  return (
    <Card>
      <Text style={styles.sectionHeader}>Revenue reconciliation</Text>
      <View style={styles.reconRow}>
        <ReconStat label="Gross collected" value={reconciliation.grossCollectedLabel} />
        <ReconStat label="Refunded" value={`− ${reconciliation.refundedLabel}`} tone={color.danger} />
      </View>
      <View style={styles.divider} />
      <View style={styles.netRow}>
        <Text style={styles.netLabel}>Net settled</Text>
        <Text style={styles.netValue}>{reconciliation.netSettledLabel}</Text>
      </View>
      <Text style={styles.settlementNote}>
        Platform/gateway fees aren't tracked yet — net shown is gross minus refunds only.
      </Text>
    </Card>
  );
}

function ReconStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.reconLabel}>{label}</Text>
      <Text style={[styles.reconValue, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

function PaymentLinkGenerator({ venueId, onCreated }: { venueId: string; onCreated: () => void }) {
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGeneratedUrl(null);
    setLoading(true);
    try {
      const result = await createPaymentLink({
        venueId,
        amountInPaise: rupeesToPaise(amount),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        description: `Booking payment — ${customerName.trim() || 'Guest'}`,
      });
      setGeneratedUrl(result.shortUrl);
      setAmount('');
      setCustomerName('');
      setCustomerPhone('');
      onCreated();
    } catch (e) {
      setError(e instanceof PaymentsApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Text style={styles.sectionHeader}>Generate a payment link</Text>
      <Field label="Amount (₹)">
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 1200"
          placeholderTextColor={color.textOnLightFaint}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </Field>
      <Field label="Customer name">
        <TextInput
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. Rohan Mehta"
          placeholderTextColor={color.textOnLightFaint}
          style={styles.input}
        />
      </Field>
      <Field label="Customer phone">
        <TextInput
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="10-digit mobile number"
          placeholderTextColor={color.textOnLightFaint}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </Field>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        label={loading ? 'Generating…' : 'Generate link'}
        variant="primary"
        onPress={handleGenerate}
        loading={loading}
        disabled={!amount || !customerPhone}
        fullWidth
        style={{ marginTop: spacing.xs }}
      />

      {generatedUrl && (
        <View style={styles.linkResult}>
          <Text style={styles.linkUrl} numberOfLines={1}>
            {generatedUrl}
          </Text>
          <Button
            label="Share"
            variant="secondary"
            size="sm"
            onPress={() => Share.share({ message: `Pay here: ${generatedUrl}` })}
          />
        </View>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight, marginBottom: spacing.md },

  reconRow: { flexDirection: 'row', gap: spacing.md },
  reconLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted, marginBottom: 2 },
  reconValue: { fontFamily: font.sansSemiBold, fontSize: 15, color: color.textOnLight },
  divider: { height: 1, backgroundColor: color.border, marginVertical: spacing.sm },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  netLabel: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  netValue: { fontFamily: font.serif, fontSize: 26, color: color.gold },
  settlementNote: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint, marginTop: spacing.xs },

  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  input: {
    backgroundColor: color.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textOnLight,
  },
  errorText: { fontFamily: font.sansMedium, fontSize: 12, color: color.danger, marginBottom: spacing.sm },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },

  linkResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: color.background,
    borderRadius: radius.md,
  },
  linkUrl: { flex: 1, fontFamily: font.sansMedium, fontSize: 13, color: color.info },
});