import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { createVenue, VenueRecord } from '../services/venuesService';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (venue: VenueRecord) => void;
};

export function AddVenueModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sportsInput, setSportsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setAddress('');
    setSportsInput('');
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Venue name is required.';
    if (!address.trim()) nextErrors.address = 'Address is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const sports = sportsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const venue = await createVenue({ name: name.trim(), address: address.trim(), sports });
      onCreated(venue);
      reset();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not create venue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet visible={visible} title="Add venue" onClose={handleClose}>
      <FormField
        label="Venue name"
        placeholder="e.g. Sunrise Sports Arena"
        value={name}
        onChangeText={setName}
        error={errors.name}
        editable={!submitting}
      />
      <FormField
        label="Address"
        placeholder="e.g. Sector 17, Chandigarh"
        value={address}
        onChangeText={setAddress}
        error={errors.address}
        editable={!submitting}
      />
      <FormField
        label="Sports (comma separated)"
        placeholder="e.g. Football, Badminton, Cricket"
        value={sportsInput}
        onChangeText={setSportsInput}
        editable={!submitting}
      />

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <View style={styles.actionsRow}>
        <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
        <Button label="Add venue" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger },
});