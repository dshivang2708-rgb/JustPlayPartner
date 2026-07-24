export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  priceLabel: string; // per hour
};

export const equipmentItems: EquipmentItem[] = [
  { id: 'e1', name: 'Badminton Racket', category: 'Badminton', stock: 18, lowStockThreshold: 5, priceLabel: '₹40/hr' },
  { id: 'e2', name: 'Shuttlecock (tube)', category: 'Badminton', stock: 4, lowStockThreshold: 6, priceLabel: '₹60' },
  { id: 'e3', name: 'Football (size 5)', category: 'Football', stock: 9, lowStockThreshold: 4, priceLabel: '₹50/hr' },
  { id: 'e4', name: 'Cricket Bat', category: 'Cricket', stock: 3, lowStockThreshold: 4, priceLabel: '₹70/hr' },
  { id: 'e5', name: 'Cricket Ball (leather)', category: 'Cricket', stock: 12, lowStockThreshold: 6, priceLabel: '₹30' },
  { id: 'e6', name: 'Tennis Racket', category: 'Tennis', stock: 7, lowStockThreshold: 4, priceLabel: '₹50/hr' },
  { id: 'e7', name: 'Bibs (set of 10)', category: 'Football', stock: 6, lowStockThreshold: 3, priceLabel: '₹100/session' },
  { id: 'e8', name: 'Table Tennis Paddle', category: 'Table Tennis', stock: 2, lowStockThreshold: 4, priceLabel: '₹30/hr' },
];

export const equipmentCategories = ['All', 'Badminton', 'Football', 'Cricket', 'Tennis', 'Table Tennis'];