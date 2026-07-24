import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { color, font, spacing } from '../../theme/tokens';

type Props = {
  repeatPct: number;
  newPct: number;
  size?: number;
};

export function DonutChart({ repeatPct, newPct, size = 120 }: Props) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const repeatDash = (repeatPct / 100) * circumference;

  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.background}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.gold}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${repeatDash} ${circumference - repeatDash}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.centerLabel]}>
          <Text style={styles.centerValue}>{repeatPct}%</Text>
          <Text style={styles.centerCaption}>Repeat</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendRow color={color.gold} label="Repeat customers" pct={repeatPct} />
        <LegendRow color={color.background} borderColor={color.border} label="New customers" pct={newPct} />
      </View>
    </View>
  );
}

function LegendRow({ color: dotColor, borderColor, label, pct }: { color: string; borderColor?: string; label: string; pct: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: dotColor, borderColor: borderColor ?? dotColor }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  centerLabel: { alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontFamily: font.serifSemiBold, fontSize: 20, color: color.textOnLight },
  centerCaption: { fontFamily: font.sansMedium, fontSize: 10, color: color.textOnLightMuted },
  legend: { gap: spacing.xs, flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  legendLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLight, flex: 1 },
  legendPct: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLightMuted },
});