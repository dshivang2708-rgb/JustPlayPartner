import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, spacing } from '../theme/tokens';

type Props = {
  label: string;
  value: string;
  masked?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
};

export function InfoRow({ label, value, masked, revealed, onToggleReveal }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {masked && (
          <Pressable onPress={onToggleReveal} hitSlop={8}>
            <Text style={styles.revealLink}>{revealed ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted, flex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1.3, justifyContent: 'flex-end' },
  value: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight, textAlign: 'right' },
  revealLink: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.gold },
});