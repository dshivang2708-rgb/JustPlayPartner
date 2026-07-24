import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ChipRow } from '../components/ChipRow';
import { SegmentedControl } from '../components/SegmentedControl';
import { Button } from '../components/Button';
import { SlotRow } from '../components/SlotRow';
import { color, font, radius, spacing } from '../theme/tokens';
import { bookingCourts, dateChips, getSlotsFor, recurringRules } from '../data/bookingData';

const MODES = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'new', label: 'New booking' },
  { key: 'recurring', label: 'Recurring rules' },
];

export function BookingsScreen() {
  const [mode, setMode] = useState('calendar');
  const [courtKey, setCourtKey] = useState(bookingCourts[0].key);
  const [dateKey, setDateKey] = useState(dateChips[0].key);

  return (
    <ScreenScaffold
      title="Bookings"
      subtitle="Manage slots, walk-ins, and recurring holds"
    >
      <SegmentedControl options={MODES} selectedKey={mode} onChange={setMode} />

      {mode === 'calendar' && (
        <CalendarView
          courtKey={courtKey}
          dateKey={dateKey}
          onCourtChange={setCourtKey}
          onDateChange={setDateKey}
        />
      )}
      {mode === 'new' && <NewBookingForm />}
      {mode === 'recurring' && <RecurringRulesView />}
    </ScreenScaffold>
  );
}

function CalendarView({
  courtKey,
  dateKey,
  onCourtChange,
  onDateChange,
}: {
  courtKey: string;
  dateKey: string;
  onCourtChange: (k: string) => void;
  onDateChange: (k: string) => void;
}) {
  const slots = getSlotsFor(courtKey, dateKey);
  return (
    <View style={{ gap: spacing.md }}>
      <ChipRow chips={bookingCourts} selectedKey={courtKey} onSelect={onCourtChange} />
      <ChipRow chips={dateChips} selectedKey={dateKey} onSelect={onDateChange} />

      <View style={styles.legendRow}>
        <Legend color={color.danger} label="Booked" />
        <Legend color={color.success} label="Available" />
        <Legend color={color.textOnLightMuted} label="Blocked" />
      </View>

      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          {slots.map((slot) => (
            <SlotRow key={slot.time} slot={slot} />
          ))}
        </View>
      </Card>
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

function NewBookingForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [courtKey, setCourtKey] = useState(bookingCourts[0].key);
  const [dateKey, setDateKey] = useState(dateChips[0].key);
  const [time, setTime] = useState('');
  const [payment, setPayment] = useState<'cash' | 'upi' | 'pending'>('cash');

  return (
    <Card>
      <Text style={styles.cardTitle}>Add walk-in / phone booking</Text>

      <Field label="Customer name">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rohan Mehta"
          placeholderTextColor={color.textOnLightFaint}
          style={styles.input}
        />
      </Field>

      <Field label="Phone number">
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile number"
          placeholderTextColor={color.textOnLightFaint}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </Field>

      <Field label="Court / turf">
        <ChipRow chips={bookingCourts} selectedKey={courtKey} onSelect={setCourtKey} />
      </Field>

      <Field label="Date">
        <ChipRow chips={dateChips} selectedKey={dateKey} onSelect={setDateKey} />
      </Field>

      <Field label="Time slot">
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="e.g. 06:00 PM – 07:00 PM"
          placeholderTextColor={color.textOnLightFaint}
          style={styles.input}
        />
      </Field>

      <Field label="Payment">
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {(['cash', 'upi', 'pending'] as const).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setPayment(opt)}
              style={[styles.paymentChip, payment === opt && styles.paymentChipActive]}
            >
              <Text style={[styles.paymentChipText, payment === opt && styles.paymentChipTextActive]}>
                {opt === 'cash' ? 'Cash' : opt === 'upi' ? 'UPI' : 'Mark pending'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Button label="Confirm booking" variant="primary" fullWidth style={{ marginTop: spacing.xs }} />
    </Card>
  );
}

function RecurringRulesView() {
  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Text style={styles.cardTitle}>Create a recurring slot rule</Text>
        <Field label="Court / turf">
          <ChipRow chips={bookingCourts} selectedKey={bookingCourts[0].key} onSelect={() => {}} />
        </Field>
        <Field label="Repeats on">
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <Pressable key={d} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Time range">
          <TextInput
            placeholder="e.g. 06:00 AM – 08:00 AM"
            placeholderTextColor={color.textOnLightFaint}
            style={styles.input}
          />
        </Field>
        <Field label="Label (for your reference)">
          <TextInput
            placeholder="e.g. Morning academy block"
            placeholderTextColor={color.textOnLightFaint}
            style={styles.input}
          />
        </Field>
        <Button label="Save rule" variant="primary" fullWidth style={{ marginTop: spacing.xs }} />
      </Card>

      <Text style={styles.sectionLabel}>Active rules</Text>
      {recurringRules.map((rule) => (
        <Card key={rule.id}>
          <View style={styles.ruleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleLabel}>{rule.label}</Text>
              <Text style={styles.ruleMeta}>
                {rule.court} · {rule.days} · {rule.time}
              </Text>
            </View>
            <Pressable>
              <Text style={styles.ruleEdit}>Edit</Text>
            </Pressable>
          </View>
        </Card>
      ))}
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
  ruleEdit: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
});