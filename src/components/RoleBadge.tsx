import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { StaffRole } from '../services/staffService';

const ROLE_STYLE: Record<StaffRole, { bg: string; fg: string }> = {
  Owner: { bg: color.goldMuted, fg: '#8A6A2E' },
  Manager: { bg: color.infoBg, fg: color.info },
  'Front Desk': { bg: '#F1F5F9', fg: color.textOnLightMuted },
};

export function RoleBadge({ role }: { role: StaffRole }) {
  const s = ROLE_STYLE[role];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  label: { fontFamily: font.sansSemiBold, fontSize: 11 },
});