import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { HeatmapGrid } from '../components/charts/HeatmapGrid';
import { color, font, spacing } from '../theme/tokens';
import { comparisonMetrics, heatmapDays, heatmapHours, heatmapData, revenueTrend, repeatRate } from '../data/analyticsData';

export function AnalyticsScreen() {
  return (
    <ScreenScaffold title="Analytics" subtitle="Today vs last week">
      {/* Comparison strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {comparisonMetrics.map((m) => (
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
          <HeatmapGrid days={heatmapDays} hours={heatmapHours} data={heatmapData} />
        </View>
      </Card>

      {/* Revenue trend */}
      <Card>
        <Text style={styles.sectionHeader}>Revenue trend — last 7 days</Text>
        <TrendLineChart data={revenueTrend} />
      </Card>

      {/* Repeat-rate donut */}
      <Card>
        <Text style={styles.sectionHeader}>Customer repeat rate</Text>
        <View style={{ marginTop: spacing.sm }}>
          <DonutChart repeatPct={repeatRate.repeatPct} newPct={repeatRate.newPct} />
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
});