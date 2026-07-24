import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, spacing } from '../theme/tokens';
import { GstInvoice } from '../data/paymentsData';

export function InvoiceRow({ invoice, onDownload }: { invoice: GstInvoice; onDownload?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.invoiceNo}>{invoice.invoiceNo}</Text>
        <Text style={styles.meta}>
          {invoice.periodLabel} · GST {invoice.gstAmountLabel}
        </Text>
      </View>
      <Text style={styles.amount}>{invoice.amountLabel}</Text>
      <Pressable onPress={onDownload} style={styles.downloadBtn}>
        <Text style={styles.downloadIcon}>⬇</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  invoiceNo: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  amount: { fontFamily: font.serifSemiBold, fontSize: 14, color: color.textOnLight },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: color.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: { fontSize: 14, color: color.textOnLightMuted },
});