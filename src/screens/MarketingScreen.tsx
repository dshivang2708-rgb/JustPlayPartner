import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CouponCard } from '../components/CouponCard';
import { ChipRow } from '../components/ChipRow';
import { TargetedNotificationComposer } from '../components/TargetedNotificationComposer';
import { CampaignHistoryRow } from '../components/CampaignHistoryRow';
import { color, font, radius, spacing } from '../theme/tokens';
import { coupons, microsite, recentBroadcasts, BroadcastMessage } from '../data/marketingData';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import { fetchCampaignHistory, Campaign } from '../services/marketingNotificationsService';

const CHANNELS: BroadcastMessage['channel'][] = ['In-App', 'SMS', 'WhatsApp'];

export function MarketingScreen() {
  const activeCoupons = coupons.filter((c) => c.active);

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

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

  const loadCampaigns = useCallback(async (venueId: string) => {
    setCampaignsLoading(true);
    try {
      setCampaigns(await fetchCampaignHistory(venueId));
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) loadCampaigns(selectedVenueId);
  }, [selectedVenueId, loadCampaigns]);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold title="Marketing" subtitle={`${activeCoupons.length} active offers`}>
      <MicrositeCard />

      <View>
        <Text style={styles.sectionHeader}>Active offers</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
        </View>
      </View>

      <BroadcastComposer />

      <View>
        <Text style={styles.sectionHeader}>Recent broadcasts</Text>
        <Card padded={false}>
          <View style={{ padding: spacing.md }}>
            {recentBroadcasts.map((b) => (
              <View key={b.id} style={styles.broadcastRow}>
                <Text style={styles.broadcastMessage} numberOfLines={2}>
                  {b.message}
                </Text>
                <Text style={styles.broadcastMeta}>
                  {b.channel} · {b.audienceLabel} · {b.recipientCount} recipients · {b.sentDateLabel}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Targeted in-app + push notifications -- real, backed by actual booking data */}
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first to send targeted notifications.</Text>
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

          {selectedVenueId && (
            <TargetedNotificationComposer venueId={selectedVenueId} onSent={() => loadCampaigns(selectedVenueId)} />
          )}

          <View>
            <Text style={styles.sectionHeader}>Notification history</Text>
            <Card padded={false}>
              <View style={{ padding: spacing.md }}>
                {campaignsLoading ? (
                  <ActivityIndicator color={color.gold} />
                ) : campaigns.length === 0 ? (
                  <Text style={styles.emptyText}>No targeted notifications sent yet.</Text>
                ) : (
                  campaigns.map((c) => <CampaignHistoryRow key={c.id} campaign={c} />)
                )}
              </View>
            </Card>
          </View>
        </>
      )}
    </ScreenScaffold>
  );
}

function MicrositeCard() {
  return (
    <Card>
      <Text style={styles.sectionHeader}>Venue microsite</Text>
      <Text style={styles.micrositeUrl}>{microsite.publicUrl}</Text>
      <View style={styles.micrositeStatsRow}>
        <View>
          <Text style={styles.micrositeStatValue}>{microsite.viewsThisMonth.toLocaleString('en-IN')}</Text>
          <Text style={styles.micrositeStatLabel}>Views this month</Text>
        </View>
        <Text style={styles.micrositeUpdated}>{microsite.lastUpdatedLabel}</Text>
      </View>
      <Button
        label="View public page"
        variant="secondary"
        fullWidth
        style={{ marginTop: spacing.sm }}
        onPress={() => Linking.openURL(`https://${microsite.publicUrl}`).catch(() => {})}
      />
    </Card>
  );
}

function BroadcastComposer() {
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<BroadcastMessage['channel'][]>(['In-App']);
  const [sending, setSending] = useState(false);

  const toggleChannel = (c: BroadcastMessage['channel']) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSend = () => {
    if (!message.trim() || channels.length === 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage('');
      Alert.alert('Broadcast sent', `Your message was sent via ${channels.join(', ')}.`);
    }, 700);
  };

  return (
    <Card>
      <Text style={styles.sectionHeader}>Broadcast a message</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="e.g. 20% off all weekend slots this Saturday!"
        placeholderTextColor={color.textOnLightFaint}
        multiline
        style={styles.messageInput}
      />
      <Text style={styles.fieldLabel}>Send via</Text>
      <View style={styles.channelRow}>
        {CHANNELS.map((c) => {
          const active = channels.includes(c);
          return (
            <Pressable key={c} onPress={() => toggleChannel(c)} style={[styles.channelChip, active && styles.channelChipActive]}>
              <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        label={sending ? 'Sending…' : 'Send broadcast'}
        variant="primary"
        loading={sending}
        disabled={!message.trim() || channels.length === 0}
        onPress={handleSend}
        fullWidth
        style={{ marginTop: spacing.sm }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },

  micrositeUrl: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.info, marginTop: 6 },
  micrositeStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.md },
  micrositeStatValue: { fontFamily: font.serif, fontSize: 24, color: color.textOnLight },
  micrositeStatLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted },
  micrositeUpdated: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint },

  messageInput: {
    backgroundColor: color.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textOnLight,
    minHeight: 72,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted, marginTop: spacing.md, marginBottom: spacing.xs },
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

  broadcastRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: color.border },
  broadcastMessage: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  broadcastMeta: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 3 },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});