import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { ChipRow } from './ChipRow';
import { Button } from './Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { createVenue, VenueRecord } from '../services/venuesService';
import { createCourt } from '../services/courtsService';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (venue: VenueRecord) => void;
};

const COMMON_SPORTS = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Pickleball'];

type DraftTurf = { key: string; name: string; sport: string; price: string };

function newDraftTurf(index: number): DraftTurf {
  return { key: `${Date.now()}-${index}`, name: index === 0 ? 'Turf 1' : `Turf ${index + 1}`, sport: 'Football', price: '' };
}

export function AddVenueModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sportsInput, setSportsInput] = useState('');
  const [turfs, setTurfs] = useState<DraftTurf[]>([newDraftTurf(0)]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string; turfs?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setAddress('');
    setSportsInput('');
    setTurfs([newDraftTurf(0)]);
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const updateTurf = (key: string, patch: Partial<DraftTurf>) => {
    setTurfs((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const removeTurf = (key: string) => {
    setTurfs((prev) => prev.filter((t) => t.key !== key));
  };

  const addTurf = () => {
    setTurfs((prev) => [...prev, newDraftTurf(prev.length)]);
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Venue name is required.';
    if (!address.trim()) nextErrors.address = 'Address is required.';

    const validTurfs = turfs.filter((t) => t.name.trim() || t.price.trim());
    for (const t of validTurfs) {
      const price = parseFloat(t.price);
      if (!t.name.trim() || !t.price.trim() || Number.isNaN(price) || price <= 0) {
        nextErrors.turfs = 'Each turf needs a name and a valid price per hour, or remove the row.';
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const typedSports = sportsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      // Sports a turf was tagged with count too, even if the owner didn't
      // separately type them into the free-text field above.
      const turfSports = validTurfs.map((t) => t.sport);
      const sports = Array.from(new Set([...typedSports, ...turfSports]));

      const venue = await createVenue({ name: name.trim(), address: address.trim(), sports });

      // Create each turf sequentially so a single failure is easy to
      // attribute and report, rather than firing them all in parallel.
      for (const t of validTurfs) {
        const price = parseFloat(t.price);
        await createCourt(venue.id, {
          name: t.name.trim(),
          sport: t.sport,
          basePrice: price,
          minPrice: price,
          maxPrice: price,
          openingTime: '06:00:00',
          closingTime: '23:00:00',
        });
      }

      onCreated({ ...venue, courtCount: validTurfs.length });
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
        label="Sports offered (comma separated)"
        placeholder="e.g. Football, Badminton, Cricket"
        value={sportsInput}
        onChangeText={setSportsInput}
        editable={!submitting}
      />

      <View style={styles.turfsSection}>
        <Text style={styles.turfsLabel}>Turfs / Courts</Text>
        <Text style={styles.turfsHint}>
          Add at least one turf now so customers can actually book here right away — you can add more or edit these
          anytime from the venue page.
        </Text>

        {turfs.map((t, index) => (
          <View key={t.key} style={styles.turfRow}>
            <View style={styles.turfRowHeader}>
              <Text style={styles.turfRowTitle}>Turf {index + 1}</Text>
              {turfs.length > 1 && (
                <Pressable onPress={() => removeTurf(t.key)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              )}
            </View>
            <FormField
              label="Name"
              placeholder="e.g. Turf 1"
              value={t.name}
              onChangeText={(v) => updateTurf(t.key, { name: v })}
              editable={!submitting}
            />
            <View style={{ gap: spacing.xs }}>
              <Text style={styles.chipLabel}>Sport</Text>
              <ChipRow
                chips={COMMON_SPORTS.map((s) => ({ key: s, label: s }))}
                selectedKey={t.sport}
                onSelect={(v) => updateTurf(t.key, { sport: v })}
              />
            </View>
            <FormField
              label="Price (₹ / hour)"
              placeholder="e.g. 800"
              value={t.price}
              onChangeText={(v) => updateTurf(t.key, { price: v })}
              keyboardType="numeric"
              editable={!submitting}
            />
          </View>
        ))}

        {errors.turfs ? <Text style={styles.submitError}>{errors.turfs}</Text> : null}

        <Pressable onPress={addTurf} style={styles.addTurfButton} disabled={submitting}>
          <Text style={styles.addTurfText}>+ Add another turf</Text>
        </Pressable>
      </View>

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

  turfsSection: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  turfsLabel: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight },
  turfsHint: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: -4 },
  turfRow: {
    gap: spacing.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  turfRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  turfRowTitle: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  removeText: { fontFamily: font.sansMedium, fontSize: 12, color: color.danger },
  chipLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  addTurfButton: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  addTurfText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
});