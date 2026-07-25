import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { updateMyProfile, ProfileRecord } from '../services/profileService';

type Props = {
  visible: boolean;
  profile: ProfileRecord;
  onClose: () => void;
  onSaved: (profile: ProfileRecord) => void;
};

export function EditProfileModal({ visible, profile, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [organisationName, setOrganisationName] = useState(profile.organisationName);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-sync fields whenever a fresh profile is passed in (e.g. modal reopened).
  useEffect(() => {
    if (visible) {
      setFullName(profile.fullName);
      setOrganisationName(profile.organisationName);
      setPhone(profile.phone);
      setLocation(profile.location);
      setErrors({});
      setSubmitError(null);
    }
  }, [visible, profile]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        organisationName: organisationName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet visible={visible} title="Edit profile" onClose={handleClose}>
      <FormField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        editable={!submitting}
      />

      <View>
        <Text style={styles.readOnlyLabel}>Email</Text>
        <Text style={styles.readOnlyValue}>{profile.email}</Text>
        <Text style={styles.readOnlyHint}>Email is tied to your login and can't be changed here.</Text>
      </View>

      <FormField
        label="Organisation"
        value={organisationName}
        onChangeText={setOrganisationName}
        editable={!submitting}
      />
      <FormField
        label="Mobile number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!submitting}
      />
      <FormField
        label="Location"
        value={location}
        onChangeText={setLocation}
        editable={!submitting}
      />

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
  readOnlyLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight, marginBottom: 6 },
  readOnlyValue: {
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textOnLightMuted,
    backgroundColor: color.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  readOnlyHint: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint, marginTop: 4 },
});