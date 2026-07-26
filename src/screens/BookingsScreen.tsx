import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ChipRow } from '../components/ChipRow';
import { SegmentedControl } from '../components/SegmentedControl';
import { Button } from '../components/Button';
import { SlotRow } from '../components/SlotRow';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  fetchCourts,
  fetchDaySlots,
  createWalkInBooking,
  blockSlot,
  cancelBooking,
  fetchRecurringRules,
  createRecurringRule,
  deleteRecurringRule,
  CourtOption,
  DaySlot,
  RecurringRule,
  BookingConflictError,
} from '../services/bookingsService';

const MODES = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'new', label: 'New booking' },
  { key: 'recurring', label: 'Recurring rules' },
];

/** Next 5 days starting today, generated fresh each time -- never hardcoded. */
function buildDateChips() {
  const chips: { key: string; label: string; dateStr: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? `Today, ${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`
        : i === 1
        ? `Tomorrow, ${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`
        : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
    chips.push({ key: dateStr, label, dateStr });
  }
  return chips;
}

const DATE_CHIPS = buildDateChips();
const DAY_CHIPS = [
  { key: 1, label: 'Mon' }, { key: 2, label: 'Tue' }, { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' }, { key: 5, label: 'Fri' }, { key: 6, label: 'Sat' }, { key: 7, label: 'Sun' },
];

export function BookingsScreen() {
  const [mode, setMode] = useState('calendar');
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(true);
  const [courtsError, setCourtsError] = useState<string | null>(null);
  const [courtId, setCourtId] = useState<string>('');
  const [dateStr, setDateStr] = useState(DATE_CHIPS[0].dateStr);

  const loadCourts = useCallback(async () => {
    setCourtsLoading(true);
    setCourtsError(null);
    try {
      const data = await fetchCourts();
      setCourts(data);
      if (data.length > 0) setCourtId((prev) => prev || data[0].id);
    } catch (e) {
      setCourtsError(e instanceof Error ? e.message : 'Could not load courts.');
    } finally {
      setCourtsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  return (
    <ScreenScaffold title="Bookings" subtitle="Manage slots, walk-ins, and recurring holds">
      <SegmentedControl options={MODES} selectedKey={mode} onChange={setMode} />

      {courtsLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.lg }} />
      ) : courtsError ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={styles.errorText}>{courtsError}</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={loadCourts} style={{ marginTop: spacing.sm }} />
        </View>
      ) : courts.length === 0 ? (
        <Text style={styles.emptyText}>Add a court to your venue first to manage bookings.</Text>
      ) : (
        <>
          {mode === 'calendar' && (
            <CalendarView courts={courts} courtId={courtId} dateStr={dateStr} onCourtChange={setCourtId} onDateChange={setDateStr} />
          )}
          {mode === 'new' && <NewBookingForm courts={courts} />}
          {mode === 'recurring' && <RecurringRulesView courts={courts} />}
        </>
      )}
    </ScreenScaffold>
  );
}

function CalendarView({
  courts,
  courtId,
  dateStr,
  onCourtChange,
  onDateChange,
}: {
  courts: CourtOption[];
  courtId: string;
  dateStr: string;
  onCourtChange: (k: string) => void;
  onDateChange: (k: string) => void;
}) {
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const court = courts.find((c) => c.id === courtId);

  const load = useCallback(async () => {
    if (!court) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDaySlots(court, dateStr);
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load slots.');
    } finally {
      setLoading(false);
    }
  }, [court, dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSlotPress = (slot: DaySlot, hour: number) => {
    if (!court) return;

    if (slot.status === 'available') {
      Alert.alert('Block this slot?', `${slot.time} on ${court.name} will be marked unavailable for booking.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block slot',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockSlot(court.id, dateStr, hour);
              load();
            } catch (e) {
              Alert.alert('Could not block slot', e instanceof BookingConflictError ? e.message : 'Please try again.');
            }
          },
        },
      ]);
    } else if (slot.status === 'blocked' && slot.bookingId) {
      Alert.alert('Unblock this slot?', `${slot.time} on ${court.name} will become available again.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: async () => { await cancelBooking(slot.bookingId!); load(); } },
      ]);
    } else if (slot.status === 'booked' && slot.bookingId) {
      Alert.alert(slot.customerName ?? 'Booking', `${slot.time} on ${court.name}`, [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => { await cancelBooking(slot.bookingId!); load(); },
        },
      ]);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <ChipRow chips={courts.map((c) => ({ key: c.id, label: c.name }))} selectedKey={courtId} onSelect={onCourtChange} />
      <ChipRow chips={DATE_CHIPS} selectedKey={dateStr} onSelect={onDateChange} />

      <View style={styles.legendRow}>
        <Legend color={color.danger} label="Booked" />
        <Legend color={color.success} label="Available" />
        <Legend color={color.textOnLightMuted} label="Blocked" />
      </View>

      {loading ? (
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.md }} />
      ) : error ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={load} style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <Card padded={false}>
          <View style={{ padding: spacing.md }}>
            {slots.map((slot, i) => {
              const hour = parseInt(court!.openingTime.slice(0, 2), 10) + i;
              return <SlotRow key={slot.time} slot={slot} onPress={() => handleSlotPress(slot, hour)} />;
            })}
          </View>
        </Card>
      )}
    </View>
  );
}

function Legend({ color: dotColor, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: dotColor }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function NewBookingForm({ courts }: { courts: CourtOption[] }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '');
  const [dateStr, setDateStr] = useState(DATE_CHIPS[0].dateStr);
  const [availableSlots, setAvailableSlots] = useState<DaySlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [source, setSource] = useState<'walk_in' | 'phone'>('walk_in');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const court = courts.find((c) => c.id === courtId) ?? courts[0];

  useEffect(() => {
    if (!court) return;
    setSelectedHour(null);
    fetchDaySlots(court, dateStr).then(setAvailableSlots).catch(() => setAvailableSlots([]));
  }, [court, dateStr]);

  const freeSlots = useMemo(
    () =>
      availableSlots
        .map((s, i) => ({ ...s, hour: parseInt(court?.openingTime.slice(0, 2) ?? '6', 10) + i }))
        .filter((s) => s.status === 'available'),
    [availableSlots, court]
  );

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || selectedHour === null || !court) {
      setError('Fill in the customer name, phone, and pick an available time slot.');
      return;
    }
    setSubmitting(true);
    try {
      await createWalkInBooking({
        courtId: court.id,
        dateStr,
        hour: selectedHour,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        amount: court.basePrice,
        source,
      });
      Alert.alert('Booking confirmed', `${name.trim()} booked on ${court.name}.`);
      setName('');
      setPhone('');
      setSelectedHour(null);
      fetchDaySlots(court, dateStr).then(setAvailableSlots).catch(() => {});
    } catch (e) {
      setError(e instanceof BookingConflictError ? e.message : e instanceof Error ? e.message : 'Could not create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>Add walk-in / phone booking</Text>

      <Field label="Customer name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Rohan Mehta" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
      </Field>

      <Field label="Phone number">
        <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" placeholderTextColor={color.textOnLightFaint} keyboardType="phone-pad" style={styles.input} />
      </Field>

      <Field label="Court / turf">
        <ChipRow chips={courts.map((c) => ({ key: c.id, label: c.name }))} selectedKey={courtId} onSelect={setCourtId} />
      </Field>

      <Field label="Date">
        <ChipRow chips={DATE_CHIPS} selectedKey={dateStr} onSelect={setDateStr} />
      </Field>

      <Field label="Time slot">
        {freeSlots.length === 0 ? (
          <Text style={styles.emptyText}>No available slots on this day.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {freeSlots.map((s) => (
              <Pressable
                key={s.time}
                onPress={() => setSelectedHour(s.hour)}
                style={[styles.slotChip, selectedHour === s.hour && styles.slotChipActive]}
              >
                <Text style={[styles.slotChipText, selectedHour === s.hour && styles.slotChipTextActive]}>{s.time}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Field>

      <Field label="Source">
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {(['walk_in', 'phone'] as const).map((opt) => (
            <Pressable key={opt} onPress={() => setSource(opt)} style={[styles.paymentChip, source === opt && styles.paymentChipActive]}>
              <Text style={[styles.paymentChipText, source === opt && styles.paymentChipTextActive]}>
                {opt === 'walk_in' ? 'Walk-in' : 'Phone booking'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button label={submitting ? 'Confirming…' : 'Confirm booking'} variant="primary" loading={submitting} onPress={handleSubmit} fullWidth style={{ marginTop: spacing.xs }} />
    </Card>
  );
}

function RecurringRulesView({ courts }: { courts: CourtOption[] }) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '');
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await fetchRecurringRules());
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleSave = async () => {
    setError(null);
    if (!courtId || days.length === 0 || !startTime.trim() || !endTime.trim() || !label.trim()) {
      setError('Fill in every field and pick at least one day.');
      return;
    }
    setSaving(true);
    try {
      await createRecurringRule({ courtId, label: label.trim(), daysOfWeek: days, startTime: startTime.trim(), endTime: endTime.trim() });
      setLabel('');
      setStartTime('');
      setEndTime('');
      setDays([]);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete rule?', 'This will not affect existing bookings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecurringRule(id); load(); } },
    ]);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Text style={styles.cardTitle}>Create a recurring slot rule</Text>
        <Field label="Court / turf">
          <ChipRow chips={courts.map((c) => ({ key: c.id, label: c.name }))} selectedKey={courtId} onSelect={setCourtId} />
        </Field>
        <Field label="Repeats on">
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {DAY_CHIPS.map((d) => (
              <Pressable key={d.key} onPress={() => toggleDay(d.key)} style={[styles.dayChip, days.includes(d.key) && styles.slotChipActive]}>
                <Text style={[styles.dayChipText, days.includes(d.key) && styles.slotChipTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Start time (24hr, e.g. 06:00)">
          <TextInput value={startTime} onChangeText={setStartTime} placeholder="06:00" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
        </Field>
        <Field label="End time (24hr, e.g. 08:00)">
          <TextInput value={endTime} onChangeText={setEndTime} placeholder="08:00" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
        </Field>
        <Field label="Label (for your reference)">
          <TextInput value={label} onChangeText={setLabel} placeholder="e.g. Morning academy block" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
        </Field>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button label={saving ? 'Saving…' : 'Save rule'} variant="primary" loading={saving} onPress={handleSave} fullWidth style={{ marginTop: spacing.xs }} />
      </Card>

      <Text style={styles.sectionLabel}>Active rules</Text>
      {loading ? (
        <ActivityIndicator color={color.gold} />
      ) : rules.length === 0 ? (
        <Text style={styles.emptyText}>No recurring rules yet.</Text>
      ) : (
        rules.map((rule) => (
          <Card key={rule.id}>
            <View style={styles.ruleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleLabel}>{rule.label}</Text>
                <Text style={styles.ruleMeta}>
                  {rule.courtName} · {rule.daysOfWeek.map((d) => DAY_CHIPS.find((c) => c.key === d)?.label).join(', ')} · {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(rule.id)}>
                <Text style={styles.ruleEdit}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight, marginBottom: spacing.md },
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  input: {
    backgroundColor: color.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textOnLight,
  },
  legendRow: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },

  paymentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  paymentChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  paymentChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  paymentChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  slotChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  slotChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  slotChipText: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },
  slotChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  dayChip: {
    width: 42,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
  },
  dayChipText: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },

  sectionLabel: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLightMuted, marginTop: spacing.xs },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleLabel: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  ruleMeta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  ruleEdit: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.danger },

  errorText: { fontFamily: font.sansMedium, fontSize: 12, color: color.danger, marginBottom: spacing.xs, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});