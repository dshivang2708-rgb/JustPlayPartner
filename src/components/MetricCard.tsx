import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { color, font, spacing } from '../theme/tokens';

type Props = {
  label: string;
  value: string;
  deltaLabel?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  emphasize?: boolean; // gold highlight for the single most important number on screen
  size?: 'lg' | 'md';
};

export function MetricCard({ label, value, deltaLabel, deltaDirection, emphasize, size = 'md' }: Props) {
  const deltaColor =
    deltaDirection === 'up' ? color.success : deltaDirection === 'down' ? color.danger : color.textOnLightMuted;
  const deltaSign = deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : '—';

  return (
    <Card>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          size === 'lg' ? styles.valueLg : styles.valueMd,
          { color: emphasize ? color.gold : color.textOnLight },
        ]}
      >
        {value}
      </Text>
      {deltaLabel ? (
        <View style={styles.deltaRow}>
          <Text style={[styles.delta, { color: deltaColor }]}>
            {deltaSign} {deltaLabel}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: font.sansMedium, fontSize: 12, letterSpacing: 0.4, color: color.textOnLightMuted, marginBottom: 6 },
  valueLg: { fontFamily: font.serif, fontSize: 34, lineHeight: 40 },
  valueMd: { fontFamily: font.serif, fontSize: 24, lineHeight: 30 },
  deltaRow: { marginTop: spacing.xs },
  delta: { fontFamily: font.sansSemiBold, fontSize: 13 },
});
