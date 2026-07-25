import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { StatusBadge, StatusTone } from './StatusBadge';
import { color, font, spacing } from '../theme/tokens';
export type EventCardData = {
  id: string;
  title: string;
  venueName: string;
  dateLabel: string;
  status: 'upcoming' | 'past' | 'pending';
  participantsLabel: string;
};

const STATUS_TONE: Record<EventCardData['status'], StatusTone> = {
  upcoming: 'info',
  past: 'neutral',
  pending: 'warning',
};

const STATUS_LABEL: Record<EventCardData['status'], string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  pending: 'Pending',
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <StatusBadge label={STATUS_LABEL[event.status]} tone={STATUS_TONE[event.status]} />
      </View>
      <Text style={styles.meta}>
        {event.venueName} · {event.dateLabel}
      </Text>
      <Text style={styles.participants}>{event.participantsLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight, lineHeight: 19 },
  meta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 6 },
  participants: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightFaint, marginTop: 2 },
});