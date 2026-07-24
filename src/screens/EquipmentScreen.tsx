import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { ChipRow } from '../components/ChipRow';
import { EquipmentCard } from '../components/EquipmentCard';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { equipmentItems, equipmentCategories } from '../data/equipmentData';

export function EquipmentScreen() {
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});

  const filteredItems = useMemo(
    () => (category === 'All' ? equipmentItems : equipmentItems.filter((i) => i.category === category)),
    [category]
  );

  const addItem = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const totalItems = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const lowStockCount = equipmentItems.filter((i) => i.stock <= i.lowStockThreshold).length;

  const handleAddToBooking = () => {
    Alert.alert('Added to booking', `${totalItems} item${totalItems === 1 ? '' : 's'} attached to the current booking.`);
    setCart({});
  };

  return (
    <ScreenScaffold
      title="Equipment"
      subtitle={lowStockCount > 0 ? `${lowStockCount} item${lowStockCount === 1 ? '' : 's'} running low` : 'Inventory & rental POS'}
    >
      <ChipRow
        chips={equipmentCategories.map((c) => ({ key: c, label: c }))}
        selectedKey={category}
        onSelect={setCategory}
      />

      <View style={styles.grid}>
        {filteredItems.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            quantity={cart[item.id] ?? 0}
            onAdd={() => addItem(item.id)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </View>

      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartText}>
            {totalItems} item{totalItems === 1 ? '' : 's'} selected
          </Text>
          <Button label="Add to booking" variant="primary" size="sm" onPress={handleAddToBooking} />
        </View>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.chromeNavy,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cartText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnDark },
});