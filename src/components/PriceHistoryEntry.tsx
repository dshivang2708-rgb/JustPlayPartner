import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import { color, font, spacing } from '../theme/tokens';

type Props = {
  floor: number;
  ceiling: number;
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  step?: number;
};

const THUMB_SIZE = 22;

export function PriceRangeSlider({ floor, ceiling, minValue, maxValue, onChange, step = 50 }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const minValueRef = useRef(minValue);
  const maxValueRef = useRef(maxValue);
  minValueRef.current = minValue;
  maxValueRef.current = maxValue;
  const trackWidthRef = useRef(trackWidth);
  trackWidthRef.current = trackWidth;

  const valueToX = (value: number, width: number) => ((value - floor) / (ceiling - floor)) * width;
  const xToValue = (x: number, width: number) => {
    const raw = floor + (x / width) * (ceiling - floor);
    const stepped = Math.round(raw / step) * step;
    return Math.max(floor, Math.min(ceiling, stepped));
  };

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const width = trackWidthRef.current;
        if (width === 0) return;
        const startX = valueToX(minValueRef.current, width);
        const newX = Math.max(0, Math.min(width, startX + gesture.dx));
        const newValue = xToValue(newX, width);
        const clamped = Math.min(newValue, maxValueRef.current - step);
        onChange(Math.max(floor, clamped), maxValueRef.current);
      },
    })
  ).current;

  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const width = trackWidthRef.current;
        if (width === 0) return;
        const startX = valueToX(maxValueRef.current, width);
        const newX = Math.max(0, Math.min(width, startX + gesture.dx));
        const newValue = xToValue(newX, width);
        const clamped = Math.max(newValue, minValueRef.current + step);
        onChange(minValueRef.current, Math.min(ceiling, clamped));
      },
    })
  ).current;

  const minX = trackWidth > 0 ? valueToX(minValue, trackWidth) : 0;
  const maxX = trackWidth > 0 ? valueToX(maxValue, trackWidth) : 0;

  return (
    <View>
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>₹{minValue}</Text>
        <Text style={styles.valueLabel}>₹{maxValue}</Text>
      </View>
      <View style={styles.track} onLayout={onLayout}>
        <View style={styles.trackBg} />
        {trackWidth > 0 && (
          <>
            <View style={[styles.trackFill, { left: minX, width: Math.max(0, maxX - minX) }]} />
            <View {...minResponder.panHandlers} style={[styles.thumb, { left: minX - THUMB_SIZE / 2 }]} />
            <View {...maxResponder.panHandlers} style={[styles.thumb, { left: maxX - THUMB_SIZE / 2 }]} />
          </>
        )}
      </View>
      <View style={styles.boundsRow}>
        <Text style={styles.boundsLabel}>Floor ₹{floor}</Text>
        <Text style={styles.boundsLabel}>Ceiling ₹{ceiling}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  valueLabel: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight },
  track: { height: THUMB_SIZE, justifyContent: 'center' },
  trackBg: { height: 4, borderRadius: 2, backgroundColor: color.border },
  trackFill: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: color.gold },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: color.surface,
    borderWidth: 2,
    borderColor: color.gold,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  boundsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  boundsLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightFaint },
});