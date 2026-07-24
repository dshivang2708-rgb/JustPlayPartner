import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBadge, StatusTone } from './StatusBadge';
import { color, font, spacing } from '../theme/tokens';
import { Transaction } from '../data/paymentsData';

const STATUS_TONE: Record<Transaction['status'], StatusTone> = {
  success: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export function TransactionRow({ txn }: { txn: Transaction }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.customer}>{txn.customerName}</Text>
        <Text style={styles.meta}>
          {txn.dateLabel} · {txn.method}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{txn.amountLabel}</Text>
        <StatusBadge label={STATUS_LABEL[txn.status]} tone={STATUS_TONE[txn.status]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  customer: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontFamily: font.serifSemiBold, fontSize: 15, color: color.textOnLight },
});