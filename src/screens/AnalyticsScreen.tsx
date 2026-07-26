import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { HeatmapGrid } from '../components/charts/HeatmapGrid';
import { color, font, spacing } from '../theme/tokens';
import { fetchAnalyticsData, AnalyticsData } from '../services/analyticsService';

export function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setData(await fetchAnalyticsData());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load analytics.');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={color.gold} />;

  if (loading) {
    return (
      <ScreenScaffold title="Analytics" subtitle="Today vs last week">
        <View style={styles.centerBox}>
          <ActivityIndicator color={color.gold} />
        </View>
      </ScreenScaffold>
    );
  }

  if (error || !data) {
    return (
      <ScreenScaffold title="Analytics" subtitle="Today vs last week" refreshControl={refreshControl}>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
          <Button label="Retry" variant="secondary" onPress={() => load()} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  const hasAnyRevenue = data.revenueTrend.some((d) => d.value > 0);

  return (
    <ScreenScaffold title="Analytics" subtitle="Today vs last week" refreshControl={refreshControl}>
      {/* Comparison strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {data.comparisonMetrics.map((m) => (
          <Card key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label.toUpperCase()}</Text>
            <Text style={styles.metricValue}>{m.todayValue}</Text>
            <Text style={[styles.metricDelta, { color: m.deltaPct >= 0 ? color.success : color.danger }]}>
              {m.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(m.deltaPct)}% vs last week
            </Text>
          </Card>
        ))}
      </ScrollView>

      {/* Peak-hour heatmap */}
      <Card>
        <Text style={styles.sectionHeader}>Peak-hour occupancy</Text>
        <Text style={styles.sectionSub}>Darker cells mean busier slots — plan staffing and pricing around these.</Text>
        <View style={{ marginTop: spacing.sm }}>
          <HeatmapGrid days={data.heatmapDays} hours={data.heatmapHours} data={data.heatmapData} />
        </View>
      </Card>

      {/* Revenue trend */}
      <Card>
        <Text style={styles.sectionHeader}>Revenue trend — last 7 days</Text>
        {hasAnyRevenue ? (
          <TrendLineChart data={data.revenueTrend} />
        ) : (
          <Text style={styles.emptyText}>No revenue in the last 7 days yet.</Text>
        )}
      </Card>

      {/* Repeat-rate donut */}
      <Card>
        <Text style={styles.sectionHeader}>Customer repeat rate</Text>
        <Text style={styles.sectionSub}>Based on customer phone number across all bookings.</Text>
        <View style={{ marginTop: spacing.sm }}>
          <DonutChart repeatPct={data.repeatRate.repeatPct} newPct={data.repeatRate.newPct} />
        </View>
      </Card>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  metricCard: { width: 150 },
  metricLabel: { fontFamily: font.sansMedium, fontSize: 11, letterSpacing: 0.4, color: color.textOnLightMuted },
  metricValue: { fontFamily: font.serif, fontSize: 24, color: color.textOnLight, marginTop: 4 },
  metricDelta: { fontFamily: font.sansSemiBold, fontSize: 11, marginTop: 4 },

  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  sectionSub: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});