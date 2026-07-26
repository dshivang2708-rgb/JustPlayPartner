import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { RoleBadge } from './RoleBadge';
import { color, font, spacing } from '../theme/tokens';
import { StaffMember } from '../services/staffService';

type Props = {
  member: StaffMember;
  onEdit?: () => void;
  onRemove?: () => void;
  /** Hide actions for the current user's own Owner row -- you can't remove/downgrade yourself out of your own venue from this screen. */
  disableActions?: boolean;
};

export function StaffRow({ member, onEdit, onRemove, disableActions }: Props) {
  const initials =
    member.name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, member.kind === 'pending' && styles.avatarPending]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {member.name}
          </Text>
          {member.kind === 'pending' && <Text style={styles.pendingTag}>Pending</Text>}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {member.kind === 'pending' ? member.email : member.phone || member.joinedLabel}
        </Text>
      </View>
      <RoleBadge role={member.role} />
      {!disableActions && (
        <View style={styles.actions}>
          {member.kind === 'active' && onEdit && (
            <Pressable onPress={onEdit} hitSlop={8}>
              <Text style={styles.actionLink}>Edit</Text>
            </Pressable>
          )}
          {onRemove && (
            <Pressable onPress={onRemove} hitSlop={8}>
              <Text style={styles.actionLinkDanger}>{member.kind === 'pending' ? 'Cancel' : 'Remove'}</Text>
            </Pressable>
          )}
        </View>
      )}
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
  avatarPending: { backgroundColor: color.border },
  avatarText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight, flexShrink: 1 },
  pendingTag: {
    fontFamily: font.sansSemiBold,
    fontSize: 10,
    color: color.warning,
    backgroundColor: color.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 4 },
  actionLink: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.gold },
  actionLinkDanger: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.danger },
});