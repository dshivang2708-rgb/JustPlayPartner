import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoleBadge } from './RoleBadge';
import { color, font, spacing } from '../theme/tokens';
import { StaffMember } from '../data/staffData';

export function StaffRow({ member }: { member: StaffMember }) {
  const initials = member.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>{member.joinedLabel}</Text>
      </View>
      <RoleBadge role={member.role} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.chromeNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
  name: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
});