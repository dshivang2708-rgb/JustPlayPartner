import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_MAP: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: color.successBg, fg: color.success },
  warning: { bg: color.warningBg, fg: color.warning },
  danger: { bg: color.dangerBg, fg: color.danger },
  info: { bg: color.infoBg, fg: color.info },
  neutral: { bg: color.background, fg: color.textOnLightMuted },
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const t = TONE_MAP[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: font.sansSemiBold, fontSize: 12 },
});
