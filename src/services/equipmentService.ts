import { supabase } from '../lib/supabase';

export type PricingUnit = 'hour' | 'session' | 'flat';

export type EquipmentItem = {
  id: string;
  venueId: string;
  name: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  rentalPrice: number;
  pricingUnit: PricingUnit;
  isReturnable: boolean;
  priceLabel: string; // derived, e.g. "₹40/hr"
};

export type OpenRental = {
  id: string;
  equipmentName: string;
  quantity: number;
  customerName: string;
  customerPhone: string | null;
  rentedAtLabel: string;
};

const UNIT_SUFFIX: Record<PricingUnit, string> = { hour: '/hr', session: '/session', flat: '' };

function toPriceLabel(rentalPrice: number, unit: PricingUnit): string {
  return `₹${rentalPrice}${UNIT_SUFFIX[unit]}`;
}

function mapItem(row: any): EquipmentItem {
  return {
    id: row.id,
    venueId: row.venue_id,
    name: row.name,
    category: row.category,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    rentalPrice: Number(row.rental_price),
    pricingUnit: row.pricing_unit,
    isReturnable: row.is_returnable,
    priceLabel: toPriceLabel(Number(row.rental_price), row.pricing_unit),
  };
}

export async function fetchEquipmentForVenue(venueId: string): Promise<EquipmentItem[]> {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('id, venue_id, name, category, stock, low_stock_threshold, rental_price, pricing_unit, is_returnable')
    .eq('venue_id', venueId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapItem);
}

export async function createEquipmentItem(input: {
  venueId: string;
  name: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  rentalPrice: number;
  pricingUnit: PricingUnit;
  isReturnable: boolean;
}): Promise<EquipmentItem> {
  const { data, error } = await supabase
    .from('equipment_items')
    .insert({
      venue_id: input.venueId,
      name: input.name,
      category: input.category,
      stock: input.stock,
      low_stock_threshold: input.lowStockThreshold,
      rental_price: input.rentalPrice,
      pricing_unit: input.pricingUnit,
      is_returnable: input.isReturnable,
    })
    .select('id, venue_id, name, category, stock, low_stock_threshold, rental_price, pricing_unit, is_returnable')
    .single();

  if (error) throw error;
  return mapItem(data);
}

export async function updateEquipmentItem(
  id: string,
  updates: {
    name: string;
    category: string;
    stock: number;
    lowStockThreshold: number;
    rentalPrice: number;
    pricingUnit: PricingUnit;
    isReturnable: boolean;
  }
): Promise<EquipmentItem> {
  const { data, error } = await supabase
    .from('equipment_items')
    .update({
      name: updates.name,
      category: updates.category,
      stock: updates.stock,
      low_stock_threshold: updates.lowStockThreshold,
      rental_price: updates.rentalPrice,
      pricing_unit: updates.pricingUnit,
      is_returnable: updates.isReturnable,
    })
    .eq('id', id)
    .select('id, venue_id, name, category, stock, low_stock_threshold, rental_price, pricing_unit, is_returnable')
    .single();

  if (error) throw error;
  return mapItem(data);
}

export async function deleteEquipmentItem(id: string): Promise<void> {
  const { error } = await supabase.from('equipment_items').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Rents one or more equipment items to a customer in one transaction per
 * item via the rent_equipment() SQL function -- see equipment_migration.sql.
 * That function locks the stock row and checks availability atomically, so
 * two staff members can't both "succeed" renting the last unit at once.
 */
export async function rentEquipmentItems(
  items: { equipmentId: string; quantity: number }[],
  customer: { name: string; phone?: string },
  bookingId?: string
): Promise<void> {
  for (const item of items) {
    const { error } = await supabase.rpc('rent_equipment', {
      target_equipment_id: item.equipmentId,
      target_quantity: item.quantity,
      target_customer_name: customer.name,
      target_customer_phone: customer.phone || null,
      target_booking_id: bookingId || null,
    });
    if (error) throw error;
  }
}

export async function fetchOpenRentalsForVenue(venueId: string): Promise<OpenRental[]> {
  const { data, error } = await supabase
    .from('equipment_rentals')
    .select('id, quantity, customer_name, customer_phone, rented_at, equipment_items(name)')
    .eq('venue_id', venueId)
    .is('returned_at', null)
    .order('rented_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    equipmentName: row.equipment_items?.name ?? 'Unknown item',
    quantity: row.quantity,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    rentedAtLabel: new Date(row.rented_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }));
}

export async function returnEquipmentRental(rentalId: string): Promise<void> {
  const { error } = await supabase.rpc('return_equipment', { target_rental_id: rentalId });
  if (error) throw error;
}