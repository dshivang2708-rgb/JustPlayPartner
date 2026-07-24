import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from './Card';
import { color, font, radius, spacing } from '../theme/tokens';
import { EquipmentItem } from '../data/equipmentData';

type Props = {
  item: EquipmentItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
};

export function EquipmentCard({ item, quantity, onAdd, onRemove }: Props) {
  const lowStock = item.stock <= item.lowStockThreshold;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.category}>{item.category}</Text>
        {lowStock && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Low stock</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.stock}>{item.stock} in stock</Text>
      <View style={styles.footerRow}>
        <Text style={styles.price}>{item.priceLabel}</Text>
        {quantity === 0 ? (
          <Pressable onPress={onAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        ) : (
          <View style={styles.stepper}>
            <Pressable onPress={onRemove} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <Pressable onPress={onAdd} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  category: { fontFamily: font.sansSemiBold, fontSize: 10, letterSpacing: 0.4, color: color.textOnLightFaint, textTransform: 'uppercase' },
  lowStockBadge: { backgroundColor: color.warningBg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  lowStockText: { fontFamily: font.sansSemiBold, fontSize: 10, color: color.warning },
  name: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight, marginTop: 6, minHeight: 34 },
  stock: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  price: { fontFamily: font.serifSemiBold, fontSize: 15, color: color.textOnLight },

  addBtn: { backgroundColor: color.goldMuted, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm },
  addBtnText: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.gold },

  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.background, borderRadius: radius.sm },
  stepperBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: font.sansBold, fontSize: 15, color: color.textOnLight },
  stepperValue: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight, minWidth: 18, textAlign: 'center' },
});