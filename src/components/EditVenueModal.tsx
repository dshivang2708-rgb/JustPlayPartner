import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { ToggleRow } from './ToggleRow';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { updateVenue, VenueRecord } from '../services/venuesService';

type Props = {
  visible: boolean;
  venue: VenueRecord | null;
  onClose: () => void;
  onUpdated: (venue: VenueRecord) => void;
};

export function EditVenueModal({ visible, venue, onClose, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sportsInput, setSportsInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && venue) {
      setName(venue.name);
      setAddress(venue.address);
      setSportsInput(venue.sports.join(', '));
      setIsActive(venue.isActive);
      setErrors({});
      setSubmitError(null);
    }
  }, [visible, venue]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!venue) return;
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

      const updated = await updateVenue(venue.id, { name: name.trim(), address: address.trim(), sports, isActive });
      onUpdated(updated);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!venue) return null;

  return (
    <FormSheet visible={visible} title="Edit venue" onClose={handleClose}>
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

      <ToggleRow
        label="Venue is active"
        description={isActive ? 'Visible to customers on the consumer app.' : 'Hidden from the consumer app entirely, including all its turfs.'}
        value={isActive}
        onValueChange={setIsActive}
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
});