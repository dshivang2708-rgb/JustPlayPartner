import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBadge, StatusTone } from './StatusBadge';
import { color, font, radius, spacing } from '../theme/tokens';
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

export function MemberRow({ member, onRenew }: { member: Member; onRenew?: () => void }) {
  const showRenew = onRenew && (member.status === 'expiring' || member.status === 'lapsed');

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>
          {member.planName} · renews {member.renewalDate}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <StatusBadge label={STATUS_LABEL[member.status]} tone={STATUS_TONE[member.status]} />
        {showRenew && (
          <Pressable onPress={onRenew} style={styles.renewBtn}>
            <Text style={styles.renewText}>Renew</Text>
          </Pressable>
        )}
      </View>
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
  renewBtn: { backgroundColor: color.goldMuted, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  renewText: { fontFamily: font.sansSemiBold, fontSize: 11, color: color.gold },
});