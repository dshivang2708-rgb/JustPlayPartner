import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../../theme/tokens';

type Props = {
  days: string[];
  hours: string[];
  data: number[][]; // [day][hour] = 0-100 intensity
};

function cellColor(intensity: number): string {
  // Interpolate from light gold-tinted background to solid gold as intensity rises.
  const clamped = Math.max(0, Math.min(100, intensity));
  const alpha = 0.08 + (clamped / 100) * 0.85;
  return `rgba(197, 160, 89, ${alpha.toFixed(2)})`;
}

export function HeatmapGrid({ days, hours, data }: Props) {
  return (
    <View>
      {/* Hour header */}
      <View style={styles.row}>
        <View style={styles.dayLabelCell} />
        {hours.map((h, i) => (
          <Text key={`${h}-${i}`} style={styles.hourLabel}>
            {h}
          </Text>
        ))}
      </View>

      {days.map((day, dayIdx) => (
        <View key={day} style={styles.row}>
          <Text style={styles.dayLabel}>{day}</Text>
          {data[dayIdx].map((val, hourIdx) => (
            <View key={hourIdx} style={[styles.cell, { backgroundColor: cellColor(val) }]} />
          ))}
        </View>
      ))}

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Low</Text>
        <View style={styles.legendGradient}>
          {[10, 30, 50, 70, 90].map((v) => (
            <View key={v} style={[styles.legendSwatch, { backgroundColor: cellColor(v) }]} />
          ))}
        </View>
        <Text style={styles.legendText}>Peak</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 26;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  dayLabelCell: { width: 32 },
  dayLabel: { width: 32, fontFamily: font.sansSemiBold, fontSize: 10, color: color.textOnLightMuted },
  hourLabel: {
    width: CELL_SIZE,
    fontFamily: font.sansMedium,
    fontSize: 8,
    color: color.textOnLightFaint,
    textAlign: 'center',
    marginHorizontal: 1,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE - 4,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  legendGradient: { flexDirection: 'row', gap: 2 },
  legendSwatch: { width: 14, height: 8, borderRadius: 2 },
  legendText: { fontFamily: font.sansMedium, fontSize: 10, color: color.textOnLightMuted },
});