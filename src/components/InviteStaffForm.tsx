import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';
import { StaffRoleForm } from './StaffRoleForm';
import { color, font, spacing } from '../theme/tokens';
import { inviteStaffMember, ROLE_DEFAULT_PERMISSIONS, StaffMember, StaffRole, Permission } from '../services/staffService';

type Props = {
  venueId: string;
  onInvited: (member: StaffMember) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteStaffForm({ venueId, onInvited }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('Front Desk');
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_DEFAULT_PERMISSIONS['Front Desk']);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyRole = (r: StaffRole) => {
    setRole(r);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[r]);
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Full name is required.';
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const member = await inviteStaffMember({
        venueId,
        fullName: name.trim(),
        email: email.trim(),
        role,
        permissions,
      });
      onInvited(member);
      setSuccessMessage(
        `Invitation sent. ${name.trim()} will be added automatically once they sign up or log in with ${email.trim()}.`
      );
      setName('');
      setEmail('');
      setRole('Front Desk');
      setPermissions(ROLE_DEFAULT_PERMISSIONS['Front Desk']);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not send invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>Invite a staff member</Text>
      <Text style={styles.helpText}>
        They'll show up as "Pending" here. As soon as they sign up (or log in, if they already have an account)
        with the email below, they're automatically added to this venue with the role you set.
      </Text>

      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <FormField
          label="Full name"
          placeholder="e.g. Sameer Khan"
          value={name}
          onChangeText={setName}
          error={errors.name}
          editable={!submitting}
        />
        <FormField
          label="Email address"
          placeholder="e.g. sameer@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          editable={!submitting}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={{ marginTop: spacing.md }}>
        <StaffRoleForm role={role} onRoleChange={applyRole} permissions={permissions} onPermissionsChange={setPermissions} />
      </View>

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <Button
        label="Send invitation"
        variant="primary"
        fullWidth
        loading={submitting}
        onPress={handleSubmit}
        style={{ marginTop: spacing.xs }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  helpText: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 4 },
  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger, marginTop: spacing.xs },
  successText: { fontFamily: font.sans, fontSize: 12, color: color.success, marginTop: spacing.xs },
});