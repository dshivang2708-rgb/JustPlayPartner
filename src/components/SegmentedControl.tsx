import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

type Props = {
  options: { key: string; label: string }[];
  selectedKey: string;
  onChange: (key: string) => void;
};

export function SegmentedControl({ options, selectedKey, onChange }: Props) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.key === selectedKey;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: color.background,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: color.border,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: color.chromeNavy },
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  labelActive: { color: color.gold, fontFamily: font.sansSemiBold },
});
