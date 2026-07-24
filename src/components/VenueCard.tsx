import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { color, font, spacing } from '../theme/tokens';
import { Venue } from '../data/homeData';

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <StatusBadge label={venue.status === 'active' ? 'Active' : 'Inactive'} tone={venue.status === 'active' ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.address}>{venue.address}</Text>
      <Text style={styles.sports} numberOfLines={1}>
        {venue.sportsLabel}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.courtCount}>{venue.courtCount} courts / turfs</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 240 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.xs },
  name: { flex: 1, fontFamily: font.serifSemiBold, fontSize: 15, color: color.textOnLight },
  address: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 4 },
  sports: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightFaint, marginTop: 2 },
  footerRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: color.border },
  courtCount: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLight },
});