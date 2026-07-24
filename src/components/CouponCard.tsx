import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { color, font, spacing } from '../theme/tokens';
import { Coupon } from '../data/marketingData';

export function CouponCard({ coupon }: { coupon: Coupon }) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.code}>{coupon.code}</Text>
        <StatusBadge label={coupon.active ? 'Active' : 'Expired'} tone={coupon.active ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.description}>{coupon.description}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.discount}>{coupon.discountLabel}</Text>
        <Text style={styles.meta}>
          {coupon.usedCount} used · {coupon.expiryLabel}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: font.sansBold, fontSize: 15, color: color.textOnLight, letterSpacing: 0.5 },
  description: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 4 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  discount: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.gold },
  meta: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted },
});