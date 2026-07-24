import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChipRow } from '../components/ChipRow';
import { PlanCard } from '../components/PlanCard';
import { MemberRow } from '../components/MemberRow';
import { SearchInput } from '../components/SearchInput';
import { color, font, radius, spacing } from '../theme/tokens';
import { membershipPlans, members, STATUS_FILTERS, RenewalStatus } from '../data/membershipData';

export function MembershipScreen() {
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'all'>('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesSearch =
        search.trim().length === 0 ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.planName.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter]);

  const totalActive = members.filter((m) => m.status === 'active').length;
  const totalExpiring = members.filter((m) => m.status === 'expiring').length;
  const totalLapsed = members.filter((m) => m.status === 'lapsed').length;

  return (
    <ScreenScaffold title="Memberships" subtitle={`${membershipPlans.length} active plans · ${members.length} members`}>
      {/* Summary strip */}
      <Card>
        <View style={styles.summaryRow}>
          <SummaryStat value={totalActive} label="Active" tone={color.success} />
          <SummaryStat value={totalExpiring} label="Expiring soon" tone={color.warning} />
          <SummaryStat value={totalLapsed} label="Lapsed" tone={color.danger} />
        </View>
      </Card>

      {/* Plans */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Membership plans</Text>
        <Pressable onPress={() => setShowPlanForm((v) => !v)}>
          <Text style={styles.newPlanLink}>{showPlanForm ? 'Close' : '+ New plan'}</Text>
        </Pressable>
      </View>

      {showPlanForm && <PlanForm onCancel={() => setShowPlanForm(false)} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {membershipPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onEdit={() => setShowPlanForm(true)} />
        ))}
      </ScrollView>

      {/* Members */}
      <Text style={styles.sectionHeader}>Members</Text>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search by name or plan" />
      <ChipRow chips={STATUS_FILTERS} selectedKey={statusFilter} onSelect={(k) => setStatusFilter(k as RenewalStatus | 'all')} />

      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          {filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No members match this filter.</Text>
          ) : (
            filteredMembers.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color: tone }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PlanForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  return (
    <Card>
      <Text style={styles.formTitle}>Create membership plan</Text>
      <Field label="Plan name">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Turf Unlimited"
          placeholderTextColor={color.textOnLightFaint}
          style={styles.input}
        />
      </Field>
      <Field label="Price">
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 2499"
          placeholderTextColor={color.textOnLightFaint}
          keyboardType="number-pad"
          style={styles.input}
        />
      </Field>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} fullWidth />
        <Button label="Save plan" variant="primary" style={{ flex: 1 }} fullWidth />
      </View>
    </Card>
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryStat: { alignItems: 'center', gap: 2 },
  summaryValue: { fontFamily: font.serif, fontSize: 24 },
  summaryLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  newPlanLink: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },

  formTitle: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight, marginBottom: spacing.md },
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
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});