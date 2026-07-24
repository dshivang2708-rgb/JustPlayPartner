import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { DiscrepancyAlert } from '../data/cameraData';

export function DiscrepancyAlertCard({ alert }: { alert: DiscrepancyAlert }) {
  const isRed = alert.severity === 'red';
  const bg = isRed ? color.dangerBg : color.warningBg;
  const fg = isRed ? color.danger : color.warning;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: isRed ? '#FCA5A5' : '#FCD34D' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.icon, { color: fg }]}>{isRed ? '⚠' : '⚡'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.court, { color: fg }]}>{alert.courtName}</Text>
          <Text style={styles.time}>{alert.timeLabel}</Text>
        </View>
      </View>
      <Text style={styles.description}>{alert.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon: { fontSize: 16 },
  court: { fontFamily: font.sansSemiBold, fontSize: 13 },
  time: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted, marginTop: 1 },
  description: { fontFamily: font.sans, fontSize: 12, color: color.textOnLight, marginTop: spacing.xs, lineHeight: 17 },
});