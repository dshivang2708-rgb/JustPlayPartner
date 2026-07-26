import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { Button } from './Button';
import { color, font, spacing } from '../theme/tokens';
import { rentEquipmentItems, EquipmentItem } from '../services/equipmentService';

type CartLine = { item: EquipmentItem; quantity: number };

type Props = {
  visible: boolean;
  cart: CartLine[];
  onClose: () => void;
  onRented: () => void;
};

export function RentCheckoutModal({ visible, cart, onClose, onRented }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    setCustomerName('');
    setCustomerPhone('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rentEquipmentItems(
        cart.map((line) => ({ equipmentId: line.item.id, quantity: line.quantity })),
        { name: customerName.trim(), phone: customerPhone.trim() || undefined }
      );
      onRented();
      setCustomerName('');
      setCustomerPhone('');
      onClose();
    } catch (e) {
      // rent_equipment() raises a real Postgres exception (e.g. "Only 2 in
      // stock") if stock changed since the cart was built -- surface it
      // directly rather than a generic message, since it's actionable.
      setError(e instanceof Error ? e.message : 'Could not complete this rental.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet visible={visible} title="Rent to customer" onClose={handleClose}>
      <View style={styles.summaryBox}>
        {cart.map((line) => (
          <View key={line.item.id} style={styles.summaryRow}>
            <Text style={styles.summaryName}>
              {line.item.name} × {line.quantity}
            </Text>
            <Text style={styles.summaryPrice}>{line.item.priceLabel}</Text>
          </View>
        ))}
      </View>

      <FormField label="Customer name" placeholder="e.g. Rohan Mehta" value={customerName} onChangeText={setCustomerName} editable={!submitting} />
      <FormField
        label="Customer phone (optional)"
        placeholder="10-digit mobile number"
        value={customerPhone}
        onChangeText={setCustomerPhone}
        keyboardType="phone-pad"
        editable={!submitting}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionsRow}>
        <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
        <Button label="Confirm rental" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  summaryBox: { backgroundColor: color.background, borderRadius: 12, padding: spacing.md, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryName: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  summaryPrice: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  errorText: { fontFamily: font.sans, fontSize: 12, color: color.danger },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});