import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, spacing } from '../theme/tokens';
import { Customer } from '../data/crmData';

export function CustomerRow({ customer, onPress }: { customer: Customer; onPress: () => void }) {
  const initials = customer.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.meta}>
          {customer.totalBookings} bookings · {customer.totalSpendLabel} · {customer.preferredSport}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.chromeNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
  name: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
  chevron: { fontFamily: font.sansSemiBold, fontSize: 20, color: color.textOnLightFaint },
});