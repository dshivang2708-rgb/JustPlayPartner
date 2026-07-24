import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

type Props = {
  label: string;
  pct: number; // 0-100
};

function toneForPct(pct: number) {
  if (pct >= 85) return color.success;
  if (pct >= 50) return color.gold;
  return color.textOnLightFaint;
}

export function OccupancyBar({ label, pct }: Props) {
  const barColor = toneForPct(pct);
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(pct, 3)}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 108, fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLight },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  pct: { width: 36, textAlign: 'right', fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLight },
});
