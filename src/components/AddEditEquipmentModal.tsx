import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { FormSheet } from './FormSheet';
import { FormField } from './FormField';
import { Button } from './Button';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  EquipmentItem,
  PricingUnit,
} from '../services/equipmentService';

type Props = {
  visible: boolean;
  venueId: string;
  /** null = creating a new item; otherwise editing this one. */
  editingItem: EquipmentItem | null;
  onClose: () => void;
  onCreated: (item: EquipmentItem) => void;
  onUpdated: (item: EquipmentItem) => void;
  onDeleted: (id: string) => void;
};

const PRICING_UNITS: PricingUnit[] = ['hour', 'session', 'flat'];

export function AddEditEquipmentModal({
  visible,
  venueId,
  editingItem,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [rentalPrice, setRentalPrice] = useState('');
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>('hour');
  const [isReturnable, setIsReturnable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; category?: string; stock?: string; rentalPrice?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(editingItem?.name ?? '');
      setCategory(editingItem?.category ?? '');
      setStock(editingItem ? String(editingItem.stock) : '');
      setLowStockThreshold(editingItem ? String(editingItem.lowStockThreshold) : '5');
      setRentalPrice(editingItem ? String(editingItem.rentalPrice) : '');
      setPricingUnit(editingItem?.pricingUnit ?? 'hour');
      setIsReturnable(editingItem?.isReturnable ?? true);
      setErrors({});
      setSubmitError(null);
    }
  }, [visible, editingItem]);

  const handleClose = () => {
    if (submitting || deleting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!category.trim()) nextErrors.category = 'Category is required.';
    const stockNum = parseInt(stock, 10);
    if (!Number.isFinite(stockNum) || stockNum < 0) nextErrors.stock = 'Enter a valid stock count.';
    const priceNum = parseFloat(rentalPrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) nextErrors.rentalPrice = 'Enter a valid price.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        stock: stockNum,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
        rentalPrice: priceNum,
        pricingUnit,
        isReturnable,
      };

      if (editingItem) {
        const updated = await updateEquipmentItem(editingItem.id, payload);
        onUpdated(updated);
      } else {
        const created = await createEquipmentItem({ venueId, ...payload });
        onCreated(created);
      }
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save this item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!editingItem) return;
    Alert.alert('Remove this item?', `${editingItem.name} will be removed from your inventory.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteEquipmentItem(editingItem.id);
            onDeleted(editingItem.id);
            onClose();
          } catch (e) {
            setSubmitError(e instanceof Error ? e.message : 'Could not remove this item.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <FormSheet visible={visible} title={editingItem ? 'Edit equipment' : 'Add equipment'} onClose={handleClose}>
      <FormField label="Name" placeholder="e.g. Badminton Racket" value={name} onChangeText={setName} error={errors.name} editable={!submitting} />
      <FormField label="Category" placeholder="e.g. Badminton" value={category} onChangeText={setCategory} error={errors.category} editable={!submitting} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormField label="Stock" placeholder="0" value={stock} onChangeText={setStock} error={errors.stock} keyboardType="number-pad" editable={!submitting} />
        </View>
        <View style={{ flex: 1 }}>
          <FormField label="Low stock alert at" placeholder="5" value={lowStockThreshold} onChangeText={setLowStockThreshold} keyboardType="number-pad" editable={!submitting} />
        </View>
      </View>

      <FormField label="Rental price (₹)" placeholder="e.g. 40" value={rentalPrice} onChangeText={setRentalPrice} error={errors.rentalPrice} keyboardType="decimal-pad" editable={!submitting} />

      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Pricing unit</Text>
        <View style={styles.unitRow}>
          {PRICING_UNITS.map((u) => (
            <Pressable key={u} onPress={() => setPricingUnit(u)} style={[styles.unitChip, pricingUnit === u && styles.unitChipActive]}>
              <Text style={[styles.unitChipText, pricingUnit === u && styles.unitChipTextActive]}>
                {u === 'hour' ? 'Per hour' : u === 'session' ? 'Per session' : 'Flat'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={() => setIsReturnable((v) => !v)} style={styles.returnableRow}>
        <View style={[styles.checkbox, isReturnable && styles.checkboxChecked]}>
          {isReturnable && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.returnableLabel}>Returnable item</Text>
          <Text style={styles.returnableHint}>
            {isReturnable
              ? "Stock returns when marked back — right for rackets, bats, etc."
              : 'Stock is consumed permanently — right for shuttlecocks, balls, etc.'}
          </Text>
        </View>
      </Pressable>

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <View style={styles.actionsRow}>
        <Button label="Cancel" variant="secondary" onPress={handleClose} disabled={submitting || deleting} style={{ flex: 1 }} />
        <Button label={editingItem ? 'Save changes' : 'Add item'} onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>

      {editingItem && (
        <Button label="Remove item" variant="secondary" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.xs }} />
      )}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  unitRow: { flexDirection: 'row', gap: spacing.xs },
  unitChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: color.border,
  },
  unitChipActive: { backgroundColor: color.chromeNavy, borderColor: color.chromeNavy },
  unitChipText: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },
  unitChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  returnableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: color.gold, borderColor: color.gold },
  checkboxMark: { fontSize: 12, color: color.chromeBlack, fontFamily: font.sansBold },
  returnableLabel: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  returnableHint: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },

  submitError: { fontFamily: font.sans, fontSize: 12, color: color.danger },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});