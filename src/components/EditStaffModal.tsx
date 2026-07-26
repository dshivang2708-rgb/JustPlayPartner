import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { StaffRoleForm } from './StaffRoleForm';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { updateStaffMember, ROLE_DEFAULT_PERMISSIONS, StaffMember, StaffRole, Permission } from '../services/staffService';

type Props = {
  visible: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSaved: (staffId: string, role: StaffRole, permissions: Permission[]) => void;
};

export function EditStaffModal({ visible, member, onClose, onSaved }: Props) {
  const [role, setRole] = useState<StaffRole>('Front Desk');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && member) {
      setRole(member.role);
      setPermissions(member.permissions);
      setSubmitError(null);
    }
  }, [visible, member]);

  const applyRole = (r: StaffRole) => {
    setRole(r);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[r]);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!member) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateStaffMember(member.id, { role, permissions });
      onSaved(member.id, role, permissions);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <FormSheet visible={visible} title={`Edit ${member.name}`} onClose={handleClose}>
      <StaffRoleForm role={role} onRoleChange={applyRole} permissions={permissions} onPermissionsChange={setPermissions} />

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <View style={styles.actionsRow}>
        <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
        <Button label="Save changes" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger },
});