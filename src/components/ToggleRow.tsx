import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { color, font, spacing } from '../theme/tokens';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function ToggleRow({ label, description, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: spacing.sm }}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.border, true: color.goldMuted }}
        thumbColor={value ? color.gold : Platform.OS === 'android' ? '#F4F3F4' : undefined}
        ios_backgroundColor={color.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  label: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  description: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
});