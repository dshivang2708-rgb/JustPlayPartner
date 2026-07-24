import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

export type Chip = { key: string; label: string };

type Props = {
  chips: Chip[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function ChipRow({ chips, selectedKey, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.key === selectedKey;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  chipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  labelActive: { color: color.gold, fontFamily: font.sansSemiBold },
});
