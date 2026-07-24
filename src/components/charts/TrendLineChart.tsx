import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { color, font } from '../../theme/tokens';

type Point = { label: string; value: number };

type Props = {
  data: Point[];
  height?: number;
};

export function TrendLineChart({ data, height = 140 }: Props) {
  const width = 300;
  const paddingX = 24;
  const paddingY = 20;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = paddingY + (1 - (d.value - min) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingY + f * (height - paddingY * 2)}
            y2={paddingY + f * (height - paddingY * 2)}
            stroke={color.border}
            strokeWidth={1}
          />
        ))}

        <Polyline points={polylinePoints} fill="none" stroke={color.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? color.gold : color.surface} stroke={color.gold} strokeWidth={1.5} />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((d) => (
          <Text key={d.label} style={styles.label}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 2 },
  label: { fontFamily: font.sansMedium, fontSize: 10, color: color.textOnLightMuted },
});