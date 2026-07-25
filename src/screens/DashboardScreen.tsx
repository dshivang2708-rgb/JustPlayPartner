import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { MetricCard } from '../components/MetricCard';
import { OccupancyBar } from '../components/OccupancyBar';
import { IconChip } from '../components/IconChip';
import { Button } from '../components/Button';
import { color, font, spacing } from '../theme/tokens';
import { fetchDashboardData, DashboardData } from '../services/dashboardService';
import { fetchMyVenues } from '../services/venuesService';

const TODAY_LABEL = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function DashboardScreen({ navigation }: { navigation: any }) {
  const [venueName, setVenueName] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [dashboard, venues] = await Promise.all([fetchDashboardData(), fetchMyVenues()]);
      setData(dashboard);
      setVenueName(venues[0]?.name ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard data.');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quickActions = (
    <View style={styles.quickActionsRow}>
      <IconChip icon="🚫" label="Block a slot" onPress={() => navigation?.navigate?.('Bookings')} />
      <IconChip icon="➕" label="Add walk-in" onPress={() => navigation?.navigate?.('Bookings')} />
      <IconChip icon="🔗" label="Payment link" onPress={() => navigation?.navigate?.('Payments')} />
    </View>
  );

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={color.gold} />
  );

  if (loading) {
    return (
      <ScreenScaffold title="Dashboard" subtitle={TODAY_LABEL} chromeContent={quickActions}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={color.gold} />
        </View>
      </ScreenScaffold>
    );
  }

  if (error || !data) {
    return (
      <ScreenScaffold title="Dashboard" subtitle={TODAY_LABEL} chromeContent={quickActions} refreshControl={refreshControl}>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
          <Button label="Retry" variant="secondary" onPress={() => load()} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  const hasNoVenues = venueName === null;

  return (
    <ScreenScaffold
      title={venueName ?? 'Your venue'}
      subtitle={TODAY_LABEL}
      chromeContent={quickActions}
      refreshControl={refreshControl}
    >
      {hasNoVenues ? (
        <Card>
          <Text style={styles.emptyTitle}>No venue yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first venue from the Home tab to start seeing live bookings and revenue here.
          </Text>
        </Card>
      ) : (
        <>
          <MetricCard
            label="REVENUE TODAY"
            value={data.revenueTodayLabel}
            deltaLabel={
              data.deltaPct !== null
                ? `${Math.abs(data.deltaPct)}% vs yesterday`
                : data.revenueTodayRaw > 0
                ? 'No revenue yesterday to compare'
                : undefined
            }
            deltaDirection={data.deltaDirection}
            emphasize
            size="lg"
          />

          <Card>
            <Text style={styles.sectionHeader}>Today's bookings</Text>
            <View style={styles.bookingRow}>
              <BookingStat label="Total" value={data.totalBookings} />
              <BookingStat label="Confirmed" value={data.confirmedBookings} tone={color.success} />
              <BookingStat label="Walk-ins" value={data.walkInBookings} tone={color.gold} />
              <BookingStat label="Cancelled" value={data.cancelledBookings} tone={color.danger} />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionHeader}>Occupancy by court</Text>
            {data.courtOccupancy.length === 0 ? (
              <Text style={styles.emptySubtitle}>Add courts to your venue to see occupancy here.</Text>
            ) : (
              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                {data.courtOccupancy.map((c) => (
                  <OccupancyBar key={c.courtId} label={c.courtName} pct={c.occupancyPct} />
                ))}
              </View>
            )}
          </Card>
        </>
      )}
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
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  emptyTitle: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight },
  emptySubtitle: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, marginTop: 4, lineHeight: 19 },
});