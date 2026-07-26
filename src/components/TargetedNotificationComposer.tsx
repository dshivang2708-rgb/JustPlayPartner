import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { ChipRow } from './ChipRow';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  fetchVenueSports,
  previewAudience,
  createAndSendCampaign,
  AudienceFilters,
  NotificationChannel,
} from '../services/marketingNotificationsService';

const INACTIVE_OPTIONS = [
  { key: 'any', label: 'Any', days: null },
  { key: '7', label: '7+ days', days: 7 },
  { key: '14', label: '14+ days', days: 14 },
  { key: '30', label: '30+ days', days: 30 },
  { key: '60', label: '60+ days', days: 60 },
  { key: '90', label: '90+ days', days: 90 },
];

type Props = {
  venueId: string;
  onSent: () => void;
};

export function TargetedNotificationComposer({ venueId, onSent }: Props) {
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [minSpend, setMinSpend] = useState('');
  const [minBookings, setMinBookings] = useState('');
  const [inactiveKey, setInactiveKey] = useState('any');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<NotificationChannel[]>(['in_app']);

  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchVenueSports(venueId)
      .then(setSports)
      .catch(() => setSports([]));
  }, [venueId]);

  const filters: AudienceFilters = useMemo(
    () => ({
      sport: selectedSport,
      minTotalSpend: minSpend.trim() ? Number(minSpend) : null,
      minTotalBookings: minBookings.trim() ? Number(minBookings) : null,
      inactiveDays: INACTIVE_OPTIONS.find((o) => o.key === inactiveKey)?.days ?? null,
    }),
    [selectedSport, minSpend, minBookings, inactiveKey]
  );

  const runPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const rows = await previewAudience(venueId, filters);
      setAudienceCount(rows.length);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : 'Could not compute audience.');
      setAudienceCount(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [venueId, filters]);

  // Debounced live preview whenever a filter changes.
  useEffect(() => {
    const handle = setTimeout(runPreview, 400);
    return () => clearTimeout(handle);
  }, [runPreview]);

  const toggleChannel = (c: NotificationChannel) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || channels.length === 0) return;

    if (audienceCount === 0) {
      Alert.alert('No matching players', 'No registered players match these filters right now.');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      const result = await createAndSendCampaign({ venueId, title: title.trim(), body: body.trim(), channels, filters });
      setSendSuccess(
        `Sent to ${result.recipientCount} player${result.recipientCount === 1 ? '' : 's'}` +
          (channels.includes('push') ? ` (${result.pushSent} push delivered${result.pushFailed ? `, ${result.pushFailed} failed` : ''})` : '')
      );
      setTitle('');
      setBody('');
      onSent();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Could not send this notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <Text style={styles.sectionHeader}>Send a targeted notification</Text>
      <Text style={styles.helpText}>
        Reaches registered players in the consumer app only — not walk-ins without an account.
      </Text>

      {/* Filters */}
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Sport</Text>
          <ChipRow
            chips={[{ key: '__any', label: 'Any sport' }, ...sports.map((s) => ({ key: s, label: s }))]}
            selectedKey={selectedSport ?? '__any'}
            onSelect={(k) => setSelectedSport(k === '__any' ? null : k)}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.fieldLabel}>Min. spend at venue (₹)</Text>
            <TextInput
              value={minSpend}
              onChangeText={setMinSpend}
              placeholder="e.g. 2000"
              placeholderTextColor={color.textOnLightFaint}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.fieldLabel}>Min. bookings</Text>
            <TextInput
              value={minBookings}
              onChangeText={setMinBookings}
              placeholder="e.g. 3"
              placeholderTextColor={color.textOnLightFaint}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Hasn't booked in</Text>
          <ChipRow chips={INACTIVE_OPTIONS} selectedKey={inactiveKey} onSelect={setInactiveKey} />
        </View>
      </View>

      {/* Live audience count */}
      <View style={styles.audienceBox}>
        {previewLoading ? (
          <ActivityIndicator size="small" color={color.gold} />
        ) : previewError ? (
          <Text style={styles.errorText}>{previewError}</Text>
        ) : (
          <Text style={styles.audienceText}>
            {audienceCount === null ? '—' : audienceCount} player{audienceCount === 1 ? '' : 's'} match these filters
          </Text>
        )}
      </View>

      {/* Message */}
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. We miss you on the court!"
            placeholderTextColor={color.textOnLightFaint}
            style={styles.input}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="e.g. Come back for 20% off your next badminton slot this week."
            placeholderTextColor={color.textOnLightFaint}
            multiline
            style={[styles.input, styles.messageInput]}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>Send via</Text>
          <View style={styles.channelRow}>
            {(['in_app', 'push'] as NotificationChannel[]).map((c) => {
              const active = channels.includes(c);
              return (
                <Pressable key={c} onPress={() => toggleChannel(c)} style={[styles.channelChip, active && styles.channelChipActive]}>
                  <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>
                    {c === 'in_app' ? 'In-app inbox' : 'Push notification'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}
      {sendSuccess ? <Text style={styles.successText}>{sendSuccess}</Text> : null}

      <Button
        label={sending ? 'Sending…' : 'Send notification'}
        variant="primary"
        loading={sending}
        disabled={!title.trim() || !body.trim() || channels.length === 0}
        onPress={handleSend}
        fullWidth
        style={{ marginTop: spacing.md }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  helpText: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 4 },
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  row: { flexDirection: 'row', gap: spacing.sm },
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
  messageInput: { minHeight: 72, textAlignVertical: 'top' },

  audienceBox: {
    marginTop: spacing.md,
    backgroundColor: color.goldMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  audienceText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },

  channelRow: { flexDirection: 'row', gap: spacing.xs },
  channelChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  channelChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  channelChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  channelChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  errorText: { fontFamily: font.sans, fontSize: 12, color: color.danger, marginTop: spacing.sm },
  successText: { fontFamily: font.sans, fontSize: 12, color: color.success, marginTop: spacing.sm },
});