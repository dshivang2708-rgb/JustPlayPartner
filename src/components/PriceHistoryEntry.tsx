import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { PriceChangeEntry } from '../data/pricingData';

export function PriceHistoryEntry({ entry, isLast }: { entry: PriceChangeEntry; isLast: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.railCol}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.court}>{entry.courtName}</Text>
          <Text style={styles.date}>{entry.dateLabel}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceFrom}>₹{entry.fromPrice}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.priceTo}>₹{entry.toPrice}</Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{entry.triggeredBy}</Text>
          </View>
        </View>
        <Text style={[styles.impact, { color: entry.revenueImpactUp ? color.success : color.danger }]}>
          {entry.revenueImpactUp ? '▲' : '▼'} {entry.revenueImpactLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  railCol: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.gold, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: color.border, marginTop: 2 },
  content: { flex: 1, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  court: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  date: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  priceFrom: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textDecorationLine: 'line-through' },
  arrow: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightFaint },
  priceTo: { fontFamily: font.serifSemiBold, fontSize: 15, color: color.textOnLight },
  modeBadge: { backgroundColor: color.background, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  modeBadgeText: { fontFamily: font.sansMedium, fontSize: 10, color: color.textOnLightMuted },
  impact: { fontFamily: font.sansSemiBold, fontSize: 12, marginTop: 4 },
});