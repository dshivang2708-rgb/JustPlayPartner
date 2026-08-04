import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { ChipRow } from './ChipRow';
import { ToggleRow } from './ToggleRow';
import { Button } from './Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { createCourt, updateCourt, setCourtActive, CourtRecord } from '../services/courtsService';
import { pickImage, setCourtImage } from '../services/imagesService';

type Props = {
  visible: boolean;
  venueId: string;
  /** null = adding a new turf; otherwise editing this one. */
  editingCourt: CourtRecord | null;
  onClose: () => void;
  onCreated: (court: CourtRecord) => void;
  onUpdated: (court: CourtRecord) => void;
};

const COMMON_SPORTS = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Pickleball'];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00:00`);

function formatHour(t: string) {
  const h = parseInt(t.slice(0, 2), 10);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12} ${suffix}`;
}

export function AddEditCourtModal({ visible, venueId, editingCourt, onClose, onCreated, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Football');
  const [basePrice, setBasePrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [openingTime, setOpeningTime] = useState('06:00:00');
  const [closingTime, setClosingTime] = useState('23:00:00');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; basePrice?: string; minPrice?: string; maxPrice?: string; hours?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(editingCourt?.name ?? '');
      setSport(editingCourt?.sport ?? 'Football');
      setBasePrice(editingCourt ? String(editingCourt.basePrice) : '');
      setMinPrice(editingCourt ? String(editingCourt.minPrice) : '');
      setMaxPrice(editingCourt ? String(editingCourt.maxPrice) : '');
      setOpeningTime(editingCourt?.openingTime ?? '06:00:00');
      setClosingTime(editingCourt?.closingTime ?? '23:00:00');
      setIsActive(editingCourt?.isActive ?? true);
      setPhotoUrl(editingCourt?.imageUrl ?? null);
      setErrors({});
      setSubmitError(null);
    }
  }, [visible, editingCourt]);

  const handleClose = () => {
    if (submitting || togglingActive) return;
    onClose();
  };

  const handleSubmit = async () => {
    const base = parseFloat(basePrice);
    const min = parseFloat(minPrice || basePrice);
    const max = parseFloat(maxPrice || basePrice);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Turf name is required.';
    if (!basePrice || Number.isNaN(base) || base <= 0) nextErrors.basePrice = 'Enter a valid price.';
    if (minPrice && (Number.isNaN(min) || min <= 0)) nextErrors.minPrice = 'Enter a valid price.';
    if (maxPrice && (Number.isNaN(max) || max <= 0)) nextErrors.maxPrice = 'Enter a valid price.';
    if (!nextErrors.minPrice && !nextErrors.maxPrice && min > max) {
      nextErrors.minPrice = 'Min price cannot exceed max price.';
    }
    if (openingTime >= closingTime) nextErrors.hours = 'Closing time must be after opening time.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const input = {
        name: name.trim(),
        sport,
        basePrice: base,
        minPrice: min,
        maxPrice: max,
        openingTime,
        closingTime,
      };

      if (editingCourt) {
        const updated = await updateCourt(editingCourt.id, { ...input, isActive });
        onUpdated(updated);
      } else {
        const created = await createCourt(venueId, input);
        onCreated(created);
      }
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save this turf. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (next: boolean) => {
    if (!editingCourt) {
      setIsActive(next);
      return;
    }
    // Flip immediately for editing turfs -- it's a common quick action, so
    // don't make the owner also hit "Save" just to hide a turf.
    setTogglingActive(true);
    try {
      await setCourtActive(editingCourt.id, next);
      setIsActive(next);
      onUpdated({ ...editingCourt, isActive: next });
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!editingCourt) return; // needs a real court id to upload against
    try {
      const localUri = await pickImage();
      if (!localUri) return;
      setUploadingPhoto(true);
      const url = await setCourtImage(venueId, editingCourt.id, localUri);
      setPhotoUrl(url);
      onUpdated({ ...editingCourt, imageUrl: url });
    } catch (e) {
      Alert.alert('Could not upload photo', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <FormSheet visible={visible} title={editingCourt ? 'Edit turf' : 'Add turf'} onClose={handleClose}>
      <FormField
        label="Turf name"
        placeholder="e.g. Turf 1, Court A"
        value={name}
        onChangeText={setName}
        error={errors.name}
        editable={!submitting}
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={styles.label}>Photo</Text>
        {editingCourt ? (
          <View style={styles.photoRow}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
            ) : (
              <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>No photo</Text>
              </View>
            )}
            {uploadingPhoto ? (
              <ActivityIndicator color={color.gold} />
            ) : (
              <Pressable onPress={handleChangePhoto}>
                <Text style={styles.photoActionText}>{photoUrl ? 'Change photo' : 'Add photo'}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Text style={styles.hint}>Save this turf first, then reopen it to add a photo.</Text>
        )}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={styles.label}>Sport</Text>
        <ChipRow
          chips={COMMON_SPORTS.map((s) => ({ key: s, label: s }))}
          selectedKey={sport}
          onSelect={setSport}
        />
      </View>

      <FormField
        label="Base price (₹ / hour)"
        placeholder="e.g. 800"
        value={basePrice}
        onChangeText={setBasePrice}
        error={errors.basePrice}
        keyboardType="numeric"
        editable={!submitting}
      />

      <View style={styles.row}>
        <FormField
          label="Min price (₹)"
          placeholder="Optional"
          value={minPrice}
          onChangeText={setMinPrice}
          error={errors.minPrice}
          keyboardType="numeric"
          editable={!submitting}
          style={{ flex: 1 }}
        />
        <FormField
          label="Max price (₹)"
          placeholder="Optional"
          value={maxPrice}
          onChangeText={setMaxPrice}
          error={errors.maxPrice}
          keyboardType="numeric"
          editable={!submitting}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={styles.hint}>Used as the allowed range for dynamic/peak pricing. Leave blank to default to the base price.</Text>

      <View style={{ gap: spacing.xs }}>
        <Text style={styles.label}>Opening time</Text>
        <ChipRow
          chips={TIME_OPTIONS.map((t) => ({ key: t, label: formatHour(t) }))}
          selectedKey={openingTime}
          onSelect={setOpeningTime}
        />
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text style={styles.label}>Closing time</Text>
        <ChipRow
          chips={TIME_OPTIONS.map((t) => ({ key: t, label: formatHour(t) }))}
          selectedKey={closingTime}
          onSelect={setClosingTime}
        />
      </View>
      {errors.hours ? <Text style={styles.submitError}>{errors.hours}</Text> : null}

      {editingCourt ? (
        <ToggleRow
          label="Turf is active"
          description={isActive ? 'Visible to customers and bookable.' : 'Hidden from the consumer app. Existing bookings are unaffected.'}
          value={isActive}
          onValueChange={handleToggleActive}
        />
      ) : null}

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <View style={styles.actionsRow}>
        <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
        <Button
          label={editingCourt ? 'Save changes' : 'Add turf'}
          onPress={handleSubmit}
          loading={submitting}
          style={{ flex: 1 }}
        />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  hint: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint, marginTop: -spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photoPreview: { width: 72, height: 56, borderRadius: radius.md },
  photoPlaceholder: { backgroundColor: color.border, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontFamily: font.sans, fontSize: 10, color: color.textOnLightFaint },
  photoActionText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
});