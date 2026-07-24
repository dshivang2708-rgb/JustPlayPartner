import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBadge, StatusTone } from './StatusBadge';
import { color, font, spacing } from '../theme/tokens';
import { Member } from '../data/membershipData';

const STATUS_TONE: Record<Member['status'], StatusTone> = {
  active: 'success',
  expiring: 'warning',
  lapsed: 'danger',
};

const STATUS_LABEL: Record<Member['status'], string> = {
  active: 'Active',
  expiring: 'Expiring soon',
  lapsed: 'Lapsed',
};

export function MemberRow({ member }: { member: Member }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>
          {member.planName} · renews {member.renewalDate}
        </Text>
      </View>
      <StatusBadge label={STATUS_LABEL[member.status]} tone={STATUS_TONE[member.status]} />
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
  name: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
});