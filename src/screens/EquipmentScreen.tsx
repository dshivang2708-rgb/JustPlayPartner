import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { ChipRow } from '../components/ChipRow';
import { SegmentedControl } from '../components/SegmentedControl';
import { Card } from '../components/Card';
import { EquipmentCard } from '../components/EquipmentCard';
import { OpenRentalRow } from '../components/OpenRentalRow';
import { AddEditEquipmentModal } from '../components/AddEditEquipmentModal';
import { RentCheckoutModal } from '../components/RentCheckoutModal';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import {
  fetchEquipmentForVenue,
  fetchOpenRentalsForVenue,
  returnEquipmentRental,
  EquipmentItem,
  OpenRental,
} from '../services/equipmentService';

const MODES = [
  { key: 'rent', label: 'Rent' },
  { key: 'open', label: 'Open rentals' },
  { key: 'manage', label: 'Manage' },
];

export function EquipmentScreen() {
  const [mode, setMode] = useState('rent');
  const [category, setCategory] = useState('All');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [openRentals, setOpenRentals] = useState<OpenRental[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  useEffect(() => {
    (async () => {
      setVenuesLoading(true);
      try {
        const data = await fetchMyVenues();
        setVenues(data);
        setSelectedVenueId((prev) => prev ?? data[0]?.id ?? null);
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, []);

  const loadItems = useCallback(async (venueId: string) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      setItems(await fetchEquipmentForVenue(venueId));
    } catch (e) {
      setItemsError(e instanceof Error ? e.message : 'Could not load equipment.');
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const loadOpenRentals = useCallback(async (venueId: string) => {
    setRentalsLoading(true);
    try {
      setOpenRentals(await fetchOpenRentalsForVenue(venueId));
    } finally {
      setRentalsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      loadItems(selectedVenueId);
      loadOpenRentals(selectedVenueId);
    }
  }, [selectedVenueId, loadItems, loadOpenRentals]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const filteredItems = useMemo(
    () => (category === 'All' ? items : items.filter((i) => i.category === category)),
    [category, items]
  );

  const addToCart = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeFromCart = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const cartLines = Object.entries(cart)
    .map(([id, quantity]) => ({ item: items.find((i) => i.id === id)!, quantity }))
    .filter((line) => line.item);
  const totalCartItems = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  const handleMarkReturned = async (rental: OpenRental) => {
    setReturningId(rental.id);
    try {
      await returnEquipmentRental(rental.id);
      setOpenRentals((prev) => prev.filter((r) => r.id !== rental.id));
      if (selectedVenueId) loadItems(selectedVenueId); // stock changed, refresh counts
    } catch (e) {
      Alert.alert('Could not mark returned', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setReturningId(null);
    }
  };

  const lowStockCount = items.filter((i) => i.stock <= i.lowStockThreshold).length;
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold
      title="Equipment"
      subtitle={
        selectedVenue
          ? lowStockCount > 0
            ? `${selectedVenue.name} · ${lowStockCount} item${lowStockCount === 1 ? '' : 's'} running low`
            : selectedVenue.name
          : 'Inventory & rental POS'
      }
    >
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first — equipment is tracked per venue.</Text>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <ChipRow
              chips={venues.map((v) => ({ key: v.id, label: v.name }))}
              selectedKey={selectedVenueId ?? venues[0].id}
              onSelect={setSelectedVenueId}
            />
          )}

          <SegmentedControl options={MODES} selectedKey={mode} onChange={setMode} />

          {mode === 'rent' && (
            <>
              <ChipRow chips={categories.map((c) => ({ key: c, label: c }))} selectedKey={category} onSelect={setCategory} />

              {itemsLoading ? (
                <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
              ) : itemsError ? (
                <Card>
                  <Text style={styles.errorText}>{itemsError}</Text>
                  <Button label="Retry" variant="secondary" size="sm" onPress={() => selectedVenueId && loadItems(selectedVenueId)} style={{ marginTop: spacing.sm }} />
                </Card>
              ) : filteredItems.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No equipment yet — switch to Manage to add some.</Text>
                </Card>
              ) : (
                <View style={styles.grid}>
                  {filteredItems.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      quantity={cart[item.id] ?? 0}
                      onAdd={() => (cart[item.id] ?? 0) < item.stock && addToCart(item.id)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}
                </View>
              )}

              {totalCartItems > 0 && (
                <View style={styles.cartBar}>
                  <Text style={styles.cartText}>
                    {totalCartItems} item{totalCartItems === 1 ? '' : 's'} selected
                  </Text>
                  <Button label="Rent to customer" variant="primary" size="sm" onPress={() => setCheckoutVisible(true)} />
                </View>
              )}
            </>
          )}

          {mode === 'open' &&
            (rentalsLoading ? (
              <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
            ) : (
              <Card padded={false}>
                <View style={{ padding: spacing.md }}>
                  {openRentals.length === 0 ? (
                    <Text style={styles.emptyText}>Nothing currently checked out.</Text>
                  ) : (
                    openRentals.map((r) => (
                      <OpenRentalRow key={r.id} rental={r} returning={returningId === r.id} onMarkReturned={() => handleMarkReturned(r)} />
                    ))
                  )}
                </View>
              </Card>
            ))}

          {mode === 'manage' && (
            <>
              <Button
                label="+ Add equipment"
                variant="primary"
                onPress={() => {
                  setEditingItem(null);
                  setEditorVisible(true);
                }}
              />
              <View style={styles.grid}>
                {items.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    quantity={0}
                    onAdd={() => {}}
                    onRemove={() => {}}
                    onEdit={() => {
                      setEditingItem(item);
                      setEditorVisible(true);
                    }}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      {selectedVenueId && (
        <AddEditEquipmentModal
          visible={editorVisible}
          venueId={selectedVenueId}
          editingItem={editingItem}
          onClose={() => setEditorVisible(false)}
          onCreated={(item) => setItems((prev) => [...prev, item])}
          onUpdated={(item) => setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}

      <RentCheckoutModal
        visible={checkoutVisible}
        cart={cartLines}
        onClose={() => setCheckoutVisible(false)}
        onRented={() => {
          setCart({});
          if (selectedVenueId) {
            loadItems(selectedVenueId);
            loadOpenRentals(selectedVenueId);
          }
        }}
      />
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
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});