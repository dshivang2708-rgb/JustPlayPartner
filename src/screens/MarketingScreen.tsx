import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CouponCard } from '../components/CouponCard';
import { color, font, radius, spacing } from '../theme/tokens';
import { coupons, microsite, recentBroadcasts, BroadcastMessage } from '../data/marketingData';

const CHANNELS: BroadcastMessage['channel'][] = ['In-App', 'SMS', 'WhatsApp'];

export function MarketingScreen() {
  const activeCoupons = coupons.filter((c) => c.active);

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
});