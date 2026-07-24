import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { Slot } from '../data/bookingData';

const STATUS_STYLE: Record<Slot['status'], { bg: string; fg: string; label: string }> = {
  booked: { bg: color.dangerBg, fg: color.danger, label: 'Booked' },
  available: { bg: color.successBg, fg: color.success, label: 'Available' },
  blocked: { bg: '#E2E8F0', fg: color.textOnLightMuted, label: 'Blocked' },
};

export function SlotRow({ slot, onPress }: { slot: Slot; onPress?: () => void }) {
  const s = STATUS_STYLE[slot.status];
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.time}>{slot.time}</Text>
      <View style={[styles.pill, { backgroundColor: s.bg }]}>
        <Text style={[styles.pillText, { color: s.fg }]}>
          {slot.status === 'booked' ? slot.customerName : s.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  time: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted, width: 90 },
  pill: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pillText: { fontFamily: font.sansSemiBold, fontSize: 13 },
});