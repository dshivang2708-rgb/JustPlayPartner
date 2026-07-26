import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { OpenRental } from '../services/equipmentService';

type Props = {
  rental: OpenRental;
  onMarkReturned: () => void;
  returning: boolean;
};

export function OpenRentalRow({ rental, onMarkReturned, returning }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {rental.equipmentName} × {rental.quantity}
        </Text>
        <Text style={styles.meta}>
          {rental.customerName}
          {rental.customerPhone ? ` · ${rental.customerPhone}` : ''} · Since {rental.rentedAtLabel}
        </Text>
      </View>
      <Button label="Mark returned" variant="secondary" size="sm" loading={returning} onPress={onMarkReturned} />
    </View>
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
  name: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  meta: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
});