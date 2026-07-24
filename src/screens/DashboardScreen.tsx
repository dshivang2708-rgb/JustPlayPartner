import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { OccupancyBar } from '../components/OccupancyBar';
import { IconChip } from '../components/IconChip';
import { color, font, spacing } from '../theme/tokens';
import { courts, bookingSummary, revenueToday } from '../data/dashboardData';

export function DashboardScreen() {
  return (
    <ScreenScaffold
      title="Sunrise Sports Arena"
      subtitle="Today, 22 Jul 2026"
      chromeContent={
        <View style={styles.quickActionsRow}>
          <IconChip icon="🚫" label="Block a slot" />
          <IconChip icon="➕" label="Add walk-in" />
          <IconChip icon="🔗" label="Payment link" />
        </View>
      }
    >
      {/* Revenue snapshot — hero number */}
      <MetricCard
        label="REVENUE TODAY"
        value={revenueToday.amount}
        deltaLabel={revenueToday.deltaLabel}
        deltaDirection={revenueToday.deltaDirection}
        emphasize
        size="lg"
      />

      {/* Today's bookings summary */}
      <Card>
        <Text style={styles.sectionHeader}>Today's bookings</Text>
        <View style={styles.bookingRow}>
          <BookingStat label="Total" value={bookingSummary.totalToday} />
          <BookingStat label="Confirmed" value={bookingSummary.confirmed} tone={color.success} />
          <BookingStat label="Walk-ins" value={bookingSummary.walkIns} tone={color.gold} />
          <BookingStat label="Cancelled" value={bookingSummary.cancelled} tone={color.danger} />
        </View>
      </Card>

      {/* Occupancy per court */}
      <Card>
        <Text style={styles.sectionHeader}>Occupancy by court</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          {courts.map((c) => (
            <OccupancyBar key={c.id} label={c.name} pct={c.occupancyPct} />
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function BookingStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <View style={styles.bookingStat}>
      <Text style={[styles.bookingValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.bookingLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight, marginBottom: spacing.sm },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingStat: { alignItems: 'center', gap: 2 },
  bookingValue: { fontFamily: font.serif, fontSize: 24, color: color.textOnLight },
  bookingLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted },
});
