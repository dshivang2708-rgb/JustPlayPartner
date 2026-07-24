import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

type Props = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
};

/** Icon+label chip for quick actions (Block a slot, Add walk-in). */
export function IconChip({ icon, label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    gap: 6,
  },
  icon: { fontSize: 20 },
  label: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLight, textAlign: 'center' },
});
