import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { StaffRow } from '../components/StaffRow';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  staffMembers,
  ROLE_DEFAULT_PERMISSIONS,
  StaffRole,
  Permission,
  WEEK_DAYS,
  shiftAssignments,
  ShiftCode,
} from '../data/staffData';

const MODES = [
  { key: 'list', label: 'Staff list' },
  { key: 'add', label: 'Add staff' },
  { key: 'shifts', label: 'Shift calendar' },
];

const ALL_PERMISSIONS: Permission[] = [
  'Manage bookings',
  'Manage pricing',
  'View payments',
  'Manage staff',
  'View analytics',
  'Manage marketing',
];

export function StaffScreen() {
  const [mode, setMode] = useState('list');

  return (
    <ScreenScaffold title="Staff" subtitle={`${staffMembers.length} team members`}>
      <SegmentedControl options={MODES} selectedKey={mode} onChange={setMode} />

      {mode === 'list' && (
        <Card padded={false}>
          <View style={{ padding: spacing.md }}>
            {staffMembers.map((m) => (
              <StaffRow key={m.id} member={m} />
            ))}
          </View>
        </Card>
      )}

      {mode === 'add' && <AddStaffForm />}
      {mode === 'shifts' && <ShiftCalendar />}
    </ScreenScaffold>
  );
}

function AddStaffForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('Front Desk');
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_DEFAULT_PERMISSIONS['Front Desk']);

  const applyRole = (r: StaffRole) => {
    setRole(r);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[r]);
  };

  const togglePermission = (p: Permission) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>Add a staff member</Text>

      <Field label="Full name">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sameer Khan"
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

      <Field label="Role">
        <View style={styles.roleRow}>
          {(['Owner', 'Manager', 'Front Desk'] as StaffRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => applyRole(r)}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
            >
              <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Permissions">
        <Text style={styles.helpText}>Defaults are applied from the role — adjust as needed.</Text>
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          {ALL_PERMISSIONS.map((p) => {
            const checked = permissions.includes(p);
            return (
              <Pressable key={p} onPress={() => togglePermission(p)} style={styles.permRow}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.permLabel}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Button label="Add staff member" variant="primary" fullWidth style={{ marginTop: spacing.xs }} />
    </Card>
  );
}

function ShiftCalendar() {
  const assignedStaff = staffMembers.filter((m) => shiftAssignments[m.id]);

  return (
    <Card padded={false}>
      <View style={{ padding: spacing.md }}>
        {/* Header row */}
        <View style={styles.calRow}>
          <Text style={[styles.calCell, styles.calNameHeader]}>Staff</Text>
          {WEEK_DAYS.map((d) => (
            <Text key={d} style={[styles.calCell, styles.calDayHeader]}>
              {d}
            </Text>
          ))}
        </View>

        {assignedStaff.map((m) => (
          <View key={m.id} style={styles.calRow}>
            <Text style={[styles.calCell, styles.calName]} numberOfLines={1}>
              {m.name.split(' ')[0]}
            </Text>
            {shiftAssignments[m.id].map((shift, i) => (
              <ShiftPill key={i} shift={shift} />
            ))}
          </View>
        ))}

        <View style={styles.legendRow}>
          <LegendDot color={color.info} label="Morning" code="M" />
          <LegendDot color={color.gold} label="Evening" code="E" />
          <LegendDot color={color.textOnLightFaint} label="Off" code="O" />
        </View>
      </View>
    </Card>
  );
}

function ShiftPill({ shift }: { shift: ShiftCode }) {
  const bg = shift === 'M' ? color.infoBg : shift === 'E' ? color.goldMuted : color.background;
  const fg = shift === 'M' ? color.info : shift === 'E' ? '#8A6A2E' : color.textOnLightFaint;
  return (
    <View style={[styles.calCell, styles.shiftPill, { backgroundColor: bg }]}>
      <Text style={[styles.shiftPillText, { color: fg }]}>{shift}</Text>
    </View>
  );
}

function LegendDot({ color: dotColor, label, code }: { color: string; label: string; code: ShiftCode }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: dotColor }]} />
      <Text style={styles.legendLabel}>
        {label} ({code})
      </Text>
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
  helpText: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted },
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

  roleRow: { flexDirection: 'row', gap: spacing.xs },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  roleChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  roleChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  roleChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: color.gold, borderColor: color.gold },
  checkboxMark: { fontSize: 12, color: color.chromeBlack, fontFamily: font.sansBold },
  permLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },

  calRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  calCell: { flex: 1, textAlign: 'center' },
  calNameHeader: { flex: 1.2, textAlign: 'left', fontFamily: font.sansSemiBold, fontSize: 11, letterSpacing: 0.6, color: color.textOnLightFaint },
  calDayHeader: { fontFamily: font.sansSemiBold, fontSize: 11, letterSpacing: 0.6, color: color.textOnLightFaint },
  calName: { flex: 1.2, textAlign: 'left', fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLight },
  shiftPill: { borderRadius: radius.sm, paddingVertical: 6, marginHorizontal: 1 },
  shiftPillText: { fontFamily: font.sansSemiBold, fontSize: 11, textAlign: 'center' },

  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: color.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },
});