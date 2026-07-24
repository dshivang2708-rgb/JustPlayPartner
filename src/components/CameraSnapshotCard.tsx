import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { CourtSnapshot } from '../data/cameraData';

const OCCUPANCY_STYLE: Record<CourtSnapshot['detectedOccupancy'], { bg: string; fg: string; label: string }> = {
  occupied: { bg: 'rgba(22,163,74,0.85)', fg: '#FFFFFF', label: 'Occupied' },
  empty: { bg: 'rgba(100,116,139,0.85)', fg: '#FFFFFF', label: 'Empty' },
  unclear: { bg: 'rgba(217,119,6,0.85)', fg: '#FFFFFF', label: 'Unclear' },
};

export function CameraSnapshotCard({ snapshot }: { snapshot: CourtSnapshot }) {
  const occ = OCCUPANCY_STYLE[snapshot.detectedOccupancy];

  return (
    <View style={styles.card}>
      <View style={styles.frame}>
        <Text style={styles.cameraIcon}>{snapshot.status === 'live' ? '📹' : '📵'}</Text>

        {snapshot.status === 'live' ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        )}

        {snapshot.status === 'live' && (
          <View style={[styles.occupancyBadge, { backgroundColor: occ.bg }]}>
            <Text style={[styles.occupancyText, { color: occ.fg }]}>{occ.label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.courtName}>{snapshot.courtName}</Text>
      <Text style={styles.updated}>{snapshot.lastUpdatedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '31%' },
  frame: {
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: color.chromeNavy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraIcon: { fontSize: 26, opacity: 0.7 },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontFamily: font.sansBold, fontSize: 8, color: '#FFFFFF', letterSpacing: 0.5 },
  offlineBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offlineText: { fontFamily: font.sansBold, fontSize: 8, color: color.textOnDarkFaint, letterSpacing: 0.5 },
  occupancyBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: radius.sm,
    paddingVertical: 3,
    alignItems: 'center',
  },
  occupancyText: { fontFamily: font.sansSemiBold, fontSize: 9 },
  courtName: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLight, marginTop: spacing.xs },
  updated: { fontFamily: font.sans, fontSize: 10, color: color.textOnLightFaint },
});