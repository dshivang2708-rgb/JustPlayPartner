import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';
import { StaffRole, Permission, ALL_PERMISSIONS } from '../services/staffService';

type Props = {
  role: StaffRole;
  onRoleChange: (role: StaffRole) => void;
  permissions: Permission[];
  onPermissionsChange: (permissions: Permission[]) => void;
};

/** Role chips + permission checklist, applying role defaults on role change but letting the partner fine-tune from there. Shared by invite and edit flows so both stay in sync. */
export function StaffRoleForm({ role, onRoleChange, permissions, onPermissionsChange }: Props) {
  const togglePermission = (p: Permission) => {
    onPermissionsChange(permissions.includes(p) ? permissions.filter((x) => x !== p) : [...permissions, p]);
  };

  return (
    <>
      <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.roleRow}>
          {(['Owner', 'Manager', 'Front Desk'] as StaffRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => onRoleChange(r)}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
            >
              <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
        <Text style={styles.fieldLabel}>Permissions</Text>
        <Text style={styles.helpText}>Defaults are applied from the role — adjust as needed.</Text>
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          {ALL_PERMISSIONS.map((p) => {
            const checked = permissions.includes(p);
            return (
              <Pressable key={p} onPress={() => togglePermission(p)} style={styles.permRow}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.permLabel}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  helpText: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted },

  roleRow: { flexDirection: 'row', gap: spacing.xs },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  roleChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  roleChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  roleChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: color.gold, borderColor: color.gold },
  checkboxMark: { fontSize: 12, color: color.chromeBlack, fontFamily: font.sansBold },
  permLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
});