import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ToggleRow } from '../components/ToggleRow';
import { Button } from '../components/Button';
import { ChipRow } from '../components/ChipRow';
import { color, font, radius, spacing } from '../theme/tokens';
import { NOTIFICATION_CHANNELS, NotificationChannel } from '../data/automationData';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import {
  fetchAutomationSettings,
  saveAutomationSettings,
  fetchNotificationPrefs,
  saveNotificationPref,
  AutomationSettings,
} from '../services/automationService';

const CADENCE_FIELDS: { key: keyof AutomationSettings; label: string; description: string }[] = [
  { key: 'monthlyReports', label: 'Monthly reports', description: 'Auto-generate on the 1st of every month' },
  { key: 'quarterlyReports', label: 'Quarterly reports', description: 'Auto-generate at the end of each quarter' },
  { key: 'halfYearlyReports', label: 'Half-yearly reports', description: 'Auto-generate every 6 months' },
  { key: 'yearlyReports', label: 'Yearly reports', description: 'Auto-generate at the end of the financial year' },
];

const NOTIFICATION_CATEGORIES = [
  { key: 'bookings', label: 'New bookings & cancellations', description: 'Real-time alerts as they happen' },
  { key: 'payments', label: 'Payment confirmations', description: 'When a customer completes payment' },
  { key: 'suggestions', label: 'New suggestions', description: 'When a new recommendation is generated' },
  { key: 'reports', label: 'Report ready', description: 'When an auto-generated report is available' },
];

export function AutomationScreen() {
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [prefs, setPrefs] = useState<Record<string, NotificationChannel[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setVenuesLoading(true);
      try {
        const data = await fetchMyVenues();
        setVenues(data);
        setSelectedVenueId((prev) => prev ?? data[0]?.id ?? null);
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (venueId: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [s, p] = await Promise.all([fetchAutomationSettings(venueId), fetchNotificationPrefs(venueId)]);
      setSettings(s);
      setPrefs(p);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load automation settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) load(selectedVenueId);
  }, [selectedVenueId, load]);

  const toggleCadence = (key: keyof AutomationSettings) => {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
    setSaved(false);
  };

  const updateGuardrail = (field: keyof AutomationSettings, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  };

  const toggleChannel = (categoryKey: string, channel: NotificationChannel) => {
    setPrefs((prev) => {
      const current = prev[categoryKey] ?? [];
      const next = current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel];
      return { ...prev, [categoryKey]: next };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedVenueId || !settings) return;
    setSaving(true);
    try {
      await saveAutomationSettings(selectedVenueId, settings);
      await Promise.all(
        NOTIFICATION_CATEGORIES.map((cat) => saveNotificationPref(selectedVenueId, cat.key, prefs[cat.key] ?? []))
      );
      setSaved(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold title="Automation" subtitle={selectedVenue ? selectedVenue.name : 'Report cadence, alerts, and pricing guardrails'}>
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first — automation settings are per venue.</Text>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <ChipRow
              chips={venues.map((v) => ({ key: v.id, label: v.name }))}
              selectedKey={selectedVenueId ?? venues[0].id}
              onSelect={setSelectedVenueId}
            />
          )}

          {loading ? (
            <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
          ) : loadError ? (
            <Card>
              <Text style={styles.errorText}>{loadError}</Text>
              <Button label="Retry" variant="secondary" size="sm" onPress={() => selectedVenueId && load(selectedVenueId)} style={{ marginTop: spacing.sm }} />
            </Card>
          ) : settings ? (
            <>
              {/* Report cadence */}
              <Card>
                <Text style={styles.sectionHeader}>Auto-generate reports</Text>
                <Text style={styles.sectionSub}>
                  Saves your preference now. Actually generating reports on a schedule needs a background job that
                  isn't set up yet — this just makes sure it's ready to use the moment that's built.
                </Text>
                <View style={{ marginTop: spacing.xs }}>
                  {CADENCE_FIELDS.map((f) => (
                    <ToggleRow
                      key={f.key}
                      label={f.label}
                      description={f.description}
                      value={settings[f.key] as boolean}
                      onValueChange={() => toggleCadence(f.key)}
                    />
                  ))}
                </View>
              </Card>

              {/* Notification channels per category */}
              <Card>
                <Text style={styles.sectionHeader}>Notification channels</Text>
                <Text style={styles.sectionSub}>
                  Choose how you'd be notified for each type of event. In-App is fully live; Email/WhatsApp delivery
                  isn't wired up yet — your choice is saved and ready for when it is.
                </Text>
                <View style={{ marginTop: spacing.sm }}>
                  {NOTIFICATION_CATEGORIES.map((cat) => (
                    <View key={cat.key} style={styles.categoryBlock}>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                      <Text style={styles.categoryDescription}>{cat.description}</Text>
                      <View style={styles.channelRow}>
                        {NOTIFICATION_CHANNELS.map((channel) => {
                          const active = (prefs[cat.key] ?? []).includes(channel);
                          return (
                            <Pressable
                              key={channel}
                              onPress={() => toggleChannel(cat.key, channel)}
                              style={[styles.channelChip, active && styles.channelChipActive]}
                            >
                              <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>{channel}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              {/* Pricing engine guardrails */}
              <Card>
                <Text style={styles.sectionHeader}>Pricing engine guardrails</Text>
                <Text style={styles.sectionSub}>
                  The price-cut ceiling below is already enforced by the Suggestions engine's pricing rule today.
                  The increase cap and approval threshold are saved and will fully apply once Pricing's own Auto mode
                  is built out.
                </Text>

                <Field label="Max automatic price increase (%)">
                  <TextInput
                    value={settings.maxAutoIncreasePct}
                    onChangeText={(v) => updateGuardrail('maxAutoIncreasePct', v)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </Field>
                <Field label="Max automatic price decrease (%)">
                  <TextInput
                    value={settings.maxAutoDecreasePct}
                    onChangeText={(v) => updateGuardrail('maxAutoDecreasePct', v)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </Field>
                <Field label="Require manual approval above (₹)">
                  <TextInput
                    value={settings.requireApprovalAbove}
                    onChangeText={(v) => updateGuardrail('requireApprovalAbove', v)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </Field>
              </Card>

              <Button
                label={saved ? 'Saved' : saving ? 'Saving…' : 'Save automation settings'}
                variant="primary"
                fullWidth
                loading={saving}
                onPress={handleSave}
              />
            </>
          ) : null}
        </>
      )}
    </ScreenScaffold>
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
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  sectionSub: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },

  categoryBlock: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: color.border },
  categoryLabel: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  categoryDescription: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
  channelRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  channelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  channelChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  channelChipText: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted },
  channelChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

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
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});