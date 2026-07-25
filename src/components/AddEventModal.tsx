import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { ChipRow } from './ChipRow';
import { ToggleRow } from './ToggleRow';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { createEvent, EventRecord } from '../services/eventsService';
import { VenueRecord } from '../services/venuesService';

type Props = {
  visible: boolean;
  venues: VenueRecord[];
  onClose: () => void;
  onCreated: (event: EventRecord) => void;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function AddEventModal({ visible, venues, onClose, onCreated }: Props) {
  const [venueId, setVenueId] = useState<string>(venues[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [participantsLabel, setParticipantsLabel] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; eventDate?: string; venue?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setEventDate('');
    setParticipantsLabel('');
    setIsPending(false);
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
    if (!venueId) nextErrors.venue = 'Add a venue first, then create an event for it.';
    if (!title.trim()) nextErrors.title = 'Event title is required.';
    if (!DATE_RE.test(eventDate.trim())) nextErrors.eventDate = 'Use format YYYY-MM-DD, e.g. 2026-08-02.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const event = await createEvent({
        venueId,
        title: title.trim(),
        eventDate: eventDate.trim(),
        participantsLabel: participantsLabel.trim(),
        isPending,
      });
      onCreated(event);
      reset();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet visible={visible} title="Add event" onClose={handleClose}>
      {venues.length === 0 ? (
        <Text style={styles.noVenueText}>
          You need at least one venue before you can create an event. Add a venue first.
        </Text>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Venue</Text>
            <ChipRow
              chips={venues.map((v) => ({ key: v.id, label: v.name }))}
              selectedKey={venueId}
              onSelect={setVenueId}
            />
            {errors.venue ? <Text style={styles.error}>{errors.venue}</Text> : null}
          </View>

          <FormField
            label="Event title"
            placeholder="e.g. Monsoon Cricket Cup"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            editable={!submitting}
          />
          <FormField
            label="Event date"
            placeholder="YYYY-MM-DD"
            value={eventDate}
            onChangeText={setEventDate}
            error={errors.eventDate}
            editable={!submitting}
            keyboardType="numbers-and-punctuation"
          />
          <FormField
            label="Participants (optional)"
            placeholder="e.g. 8 teams registered"
            value={participantsLabel}
            onChangeText={setParticipantsLabel}
            editable={!submitting}
          />

          <ToggleRow
            label="Awaiting venue slot confirmation"
            description="Mark as pending until the slot/booking is locked in."
            value={isPending}
            onValueChange={setIsPending}
          />

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <View style={styles.actionsRow}>
            <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
            <Button label="Add event" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
          </View>
        </>
      )}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger },
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  error: { fontFamily: font.sans, fontSize: 12, color: color.danger },
  noVenueText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, paddingVertical: spacing.md },
});