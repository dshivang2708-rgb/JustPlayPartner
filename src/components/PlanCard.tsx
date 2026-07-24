import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { color, font, spacing } from '../theme/tokens';
import { MembershipPlan } from '../data/membershipData';

export function PlanCard({ plan, onEdit }: { plan: MembershipPlan; onEdit?: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sport}>{plan.sport}</Text>
        {onEdit && (
          <Text style={styles.edit} onPress={onEdit}>
            Edit
          </Text>
        )}
      </View>
      <Text style={styles.name}>{plan.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{plan.priceLabel}</Text>
        <Text style={styles.cycle}>/{plan.billingCycle.toLowerCase()}</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.memberCount}>{plan.memberCount} active members</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 220 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sport: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: color.gold,
    textTransform: 'uppercase',
  },
  edit: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLightMuted },
  name: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  price: { fontFamily: font.serif, fontSize: 24, color: color.textOnLight },
  cycle: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginLeft: 4 },
  footerRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  memberCount: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },
});