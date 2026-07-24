export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Netbanking';

export type TransactionStatus = 'success' | 'pending' | 'failed' | 'refunded';

export type Transaction = {
  id: string;
  dateLabel: string;
  customerName: string;
  amountLabel: string;
  method: PaymentMethod;
  status: TransactionStatus;
};

export const transactions: Transaction[] = [
  { id: 'txn_8821', dateLabel: '22 Jul, 6:42 PM', customerName: 'Rohan Mehta', amountLabel: '₹1,200', method: 'UPI', status: 'success' },
  { id: 'txn_8820', dateLabel: '22 Jul, 5:18 PM', customerName: 'Ayesha Khan', amountLabel: '₹800', method: 'Card', status: 'success' },
  { id: 'txn_8819', dateLabel: '22 Jul, 4:05 PM', customerName: 'Vikram Singh', amountLabel: '₹1,500', method: 'UPI', status: 'pending' },
  { id: 'txn_8818', dateLabel: '22 Jul, 2:47 PM', customerName: 'Priya Desai', amountLabel: '₹950', method: 'Cash', status: 'success' },
  { id: 'txn_8817', dateLabel: '22 Jul, 1:12 PM', customerName: 'Karan Joshi', amountLabel: '₹1,100', method: 'UPI', status: 'failed' },
  { id: 'txn_8816', dateLabel: '21 Jul, 8:30 PM', customerName: 'Neha Kapoor', amountLabel: '₹700', method: 'Netbanking', status: 'refunded' },
];

export type GstInvoice = {
  id: string;
  invoiceNo: string;
  periodLabel: string;
  amountLabel: string;
  gstAmountLabel: string;
};

export const gstInvoices: GstInvoice[] = [
  { id: 'inv_1', invoiceNo: 'JP-INV-0142', periodLabel: '22 Jul 2026', amountLabel: '₹1,200', gstAmountLabel: '₹216' },
  { id: 'inv_2', invoiceNo: 'JP-INV-0141', periodLabel: '22 Jul 2026', amountLabel: '₹800', gstAmountLabel: '₹144' },
  { id: 'inv_3', invoiceNo: 'JP-INV-0140', periodLabel: '21 Jul 2026', amountLabel: '₹700', gstAmountLabel: '₹126' },
];

export const reconciliation = {
  grossCollected: '₹28,450',
  refunded: '₹700',
  platformFees: '₹512',
  netSettled: '₹27,238',
  lastSettlementLabel: 'Settled to bank account · 22 Jul, 11:00 AM',
};