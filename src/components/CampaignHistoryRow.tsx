import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, spacing } from '../theme/tokens';
import { Campaign, describeFilters } from '../services/marketingNotificationsService';

const STATUS_COLOR: Record<Campaign['status'], string> = {
  draft: color.textOnLightFaint,
  sending: color.info,
  sent: color.success,
  failed: color.danger,
};

const STATUS_LABEL: Record<Campaign['status'], string> = {
  draft: 'Draft',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Failed',
};

export function CampaignHistoryRow({ campaign }: { campaign: Campaign }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {campaign.title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {describeFilters(campaign.filters)} · {campaign.channels.join(' + ')}
        </Text>
        <Text style={styles.date}>
          {campaign.status === 'sent' ? `Sent ${campaign.sentAtLabel}` : campaign.createdAtLabel}
          {campaign.status === 'failed' && campaign.failureReason ? ` · ${campaign.failureReason}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.status, { color: STATUS_COLOR[campaign.status] }]}>{STATUS_LABEL[campaign.status]}</Text>
        {campaign.status === 'sent' && <Text style={styles.recipients}>{campaign.recipientCount} recipients</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  title: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
  date: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint, marginTop: 2 },
  status: { fontFamily: font.sansSemiBold, fontSize: 12 },
  recipients: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
});