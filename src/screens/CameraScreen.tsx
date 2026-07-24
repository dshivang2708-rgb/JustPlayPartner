import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { CameraSnapshotCard } from '../components/CameraSnapshotCard';
import { DiscrepancyAlertCard } from '../components/DiscrepancyAlertCard';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { color, font, spacing } from '../theme/tokens';
import { courtSnapshots, dailyOccupancyTimeline, discrepancyAlerts } from '../data/cameraData';

export function CameraScreen() {
  const liveCount = courtSnapshots.filter((s) => s.status === 'live').length;

  return (
    <ScreenScaffold
      title="Camera & occupancy"
      subtitle={`${liveCount} of ${courtSnapshots.length} feeds live`}
    >
      {/* Snapshot grid */}
      <Card>
        <Text style={styles.sectionHeader}>Court snapshots</Text>
        <View style={styles.grid}>
          {courtSnapshots.map((s) => (
            <CameraSnapshotCard key={s.courtId} snapshot={s} />
          ))}
        </View>
      </Card>

      {/* Daily occupancy timeline */}
      <Card>
        <Text style={styles.sectionHeader}>Today's occupancy timeline</Text>
        <Text style={styles.sectionSub}>Detected from camera feeds, hourly</Text>
        <TrendLineChart data={dailyOccupancyTimeline} />
      </Card>

      {/* Discrepancy alerts */}
      <View>
        <Text style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>Discrepancy alerts</Text>
        <View style={{ gap: spacing.sm }}>
          {discrepancyAlerts.length === 0 ? (
            <Text style={styles.emptyText}>No discrepancies detected recently.</Text>
          ) : (
            discrepancyAlerts.map((alert) => <DiscrepancyAlertCard key={alert.id} alert={alert} />)
          )}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  sectionSub: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2, marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.sm, rowGap: spacing.md },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});