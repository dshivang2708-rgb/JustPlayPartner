import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChipRow } from '../components/ChipRow';
import { PlanCard } from '../components/PlanCard';
import { MemberRow } from '../components/MemberRow';
import { SearchInput } from '../components/SearchInput';
import { color, font, radius, spacing } from '../theme/tokens';
import { STATUS_FILTERS, RenewalStatus, MembershipPlan } from '../data/membershipData';
import {
  fetchMembershipsOverview,
  createMembershipPlan,
  addMember,
  renewMember,
  MembershipsOverview,
} from '../services/membershipsService';

export function MembershipScreen() {
  const [overview, setOverview] = useState<MembershipsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await fetchMembershipsOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load memberships.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    if (!overview) return [];
    return overview.members.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesSearch =
        search.trim().length === 0 ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.planName.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [overview, search, statusFilter]);

  const handleRenew = async (membershipId: string, planName: string) => {
    const plan = overview?.plans.find((p) => p.name === planName);
    try {
      await renewMember(membershipId, plan?.billingCycle ?? 'Monthly');
      load();
    } catch (e) {
      Alert.alert('Could not renew', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  if (loading) {
    return (
      <ScreenScaffold title="Memberships" subtitle="Loading…">
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.lg }} />
      </ScreenScaffold>
    );
  }

  if (error || !overview) {
    return (
      <ScreenScaffold title="Memberships" subtitle="Plans & renewals">
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
          <Button label="Retry" variant="secondary" onPress={load} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Memberships" subtitle={`${overview.plans.length} plans · ${overview.members.length} members`}>
      <Card>
        <View style={styles.summaryRow}>
          <SummaryStat value={overview.activeCount} label="Active" tone={color.success} />
          <SummaryStat value={overview.expiringCount} label="Expiring soon" tone={color.warning} />
          <SummaryStat value={overview.lapsedCount} label="Lapsed" tone={color.danger} />
        </View>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Membership plans</Text>
        <Pressable onPress={() => setShowPlanForm((v) => !v)}>
          <Text style={styles.newPlanLink}>{showPlanForm ? 'Close' : '+ New plan'}</Text>
        </Pressable>
      </View>

      {showPlanForm && <PlanForm onCancel={() => setShowPlanForm(false)} onCreated={() => { setShowPlanForm(false); load(); }} />}

      {overview.plans.length === 0 ? (
        <Text style={styles.emptyText}>No membership plans yet — create your first one above.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {overview.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Members</Text>
        <Pressable onPress={() => setShowMemberForm((v) => !v)}>
          <Text style={styles.newPlanLink}>{showMemberForm ? 'Close' : '+ Add member'}</Text>
        </Pressable>
      </View>

      {showMemberForm && (
        <MemberForm plans={overview.plans} onCancel={() => setShowMemberForm(false)} onCreated={() => { setShowMemberForm(false); load(); }} />
      )}

      <SearchInput value={search} onChangeText={setSearch} placeholder="Search by name or plan" />
      <ChipRow chips={STATUS_FILTERS} selectedKey={statusFilter} onSelect={(k) => setStatusFilter(k as RenewalStatus | 'all')} />

      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          {filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No members match this filter.</Text>
          ) : (
            filteredMembers.map((m) => <MemberRow key={m.id} member={m} onRenew={() => handleRenew(m.id, m.planName)} />)
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

function PlanForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sport, setSport] = useState('');
  const [billingCycle, setBillingCycle] = useState<MembershipPlan['billingCycle']>('Monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const priceNum = parseFloat(price);
    if (!name.trim() || !sport.trim() || !priceNum || priceNum <= 0) {
      setError('Fill in plan name, sport, and a valid price.');
      return;
    }
    setSaving(true);
    try {
      await createMembershipPlan({ name: name.trim(), price: priceNum, billingCycle, sport: sport.trim() });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text style={styles.formTitle}>Create membership plan</Text>
      <Field label="Plan name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Turf Unlimited" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
      </Field>
      <Field label="Sport">
        <TextInput value={sport} onChangeText={setSport} placeholder="e.g. Football" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
      </Field>
      <Field label="Price">
        <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 2499" placeholderTextColor={color.textOnLightFaint} keyboardType="number-pad" style={styles.input} />
      </Field>
      <Field label="Billing cycle">
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {(['Monthly', 'Quarterly', 'Yearly'] as const).map((c) => (
            <Pressable key={c} onPress={() => setBillingCycle(c)} style={[styles.cycleChip, billingCycle === c && styles.cycleChipActive]}>
              <Text style={[styles.cycleChipText, billingCycle === c && styles.cycleChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </Field>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} fullWidth />
        <Button label={saving ? 'Saving…' : 'Save plan'} variant="primary" loading={saving} onPress={handleSave} style={{ flex: 1 }} fullWidth />
      </View>
    </Card>
  );
}

function MemberForm({ plans, onCancel, onCreated }: { plans: MembershipPlan[]; onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !planId) {
      setError('Fill in the member name, phone, and choose a plan.');
      return;
    }
    const plan = plans.find((p) => p.id === planId);
    setSaving(true);
    try {
      await addMember({ planId, customerName: name.trim(), customerPhone: phone.trim(), billingCycle: plan?.billingCycle ?? 'Monthly' });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add member.');
    } finally {
      setSaving(false);
    }
  };

  if (plans.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyText}>Create a membership plan first before adding members.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.formTitle}>Add a member</Text>
      <Field label="Member name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Rohan Mehta" placeholderTextColor={color.textOnLightFaint} style={styles.input} />
      </Field>
      <Field label="Phone number">
        <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" placeholderTextColor={color.textOnLightFaint} keyboardType="phone-pad" style={styles.input} />
      </Field>
      <Field label="Plan">
        <ChipRow chips={plans.map((p) => ({ key: p.id, label: p.name }))} selectedKey={planId} onSelect={setPlanId} />
      </Field>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} fullWidth />
        <Button label={saving ? 'Adding…' : 'Add member'} variant="primary" loading={saving} onPress={handleSave} style={{ flex: 1 }} fullWidth />
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
  cycleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  cycleChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  cycleChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  cycleChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },
  errorText: { fontFamily: font.sansMedium, fontSize: 12, color: color.danger, marginBottom: spacing.xs, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});