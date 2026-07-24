import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ToggleRow } from '../components/ToggleRow';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  initialReportCadence,
  initialNotificationCategories,
  initialPricingGuardrails,
  NOTIFICATION_CHANNELS,
  ReportCadenceSetting,
  NotificationCategory,
  NotificationChannel,
  PricingGuardrails,
} from '../data/automationData';

export function AutomationScreen() {
  const [cadence, setCadence] = useState<ReportCadenceSetting[]>(initialReportCadence);
  const [categories, setCategories] = useState<NotificationCategory[]>(initialNotificationCategories);
  const [guardrails, setGuardrails] = useState<PricingGuardrails>(initialPricingGuardrails);
  const [saved, setSaved] = useState(false);

  const toggleCadence = (key: string) => {
    setCadence((prev) => prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c)));
    setSaved(false);
  };

  const toggleChannel = (categoryKey: string, channel: NotificationChannel) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.key === categoryKey
          ? { ...c, channels: c.channels.includes(channel) ? c.channels.filter((ch) => ch !== channel) : [...c.channels, channel] }
          : c
      )
    );
    setSaved(false);
  };

  const updateGuardrail = (field: keyof PricingGuardrails, value: string) => {
    setGuardrails((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  return (
    <ScreenScaffold title="Automation" subtitle="Report cadence, alerts, and pricing guardrails">
      {/* Report cadence */}
      <Card>
        <Text style={styles.sectionHeader}>Auto-generate reports</Text>
        <View style={{ marginTop: spacing.xs }}>
          {cadence.map((c) => (
            <ToggleRow
              key={c.key}
              label={c.label}
              description={c.description}
              value={c.enabled}
              onValueChange={() => toggleCadence(c.key)}
            />
          ))}
        </View>
      </Card>

      {/* Notification channels per category */}
      <Card>
        <Text style={styles.sectionHeader}>Notification channels</Text>
        <Text style={styles.sectionSub}>Choose how you're notified for each type of event.</Text>
        <View style={{ marginTop: spacing.sm }}>
          {categories.map((cat) => (
            <View key={cat.key} style={styles.categoryBlock}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryDescription}>{cat.description}</Text>
              <View style={styles.channelRow}>
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const active = cat.channels.includes(channel);
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
        <Text style={styles.sectionSub}>Limits applied whenever Assisted or Auto pricing mode is active.</Text>

        <Field label="Max automatic price increase (%)">
          <TextInput
            value={guardrails.maxAutoIncreasePct}
            onChangeText={(v) => updateGuardrail('maxAutoIncreasePct', v)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </Field>
        <Field label="Max automatic price decrease (%)">
          <TextInput
            value={guardrails.maxAutoDecreasePct}
            onChangeText={(v) => updateGuardrail('maxAutoDecreasePct', v)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </Field>
        <Field label="Require manual approval above (₹)">
          <TextInput
            value={guardrails.requireApprovalAbove}
            onChangeText={(v) => updateGuardrail('requireApprovalAbove', v)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </Field>
      </Card>

      <Button
        label={saved ? 'Saved' : 'Save automation settings'}
        variant="primary"
        fullWidth
        onPress={() => setSaved(true)}
      />
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
});