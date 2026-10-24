/**
 * OrderFlow Pro Type Definitions
 */

export type OrderStatus = 'Pending' | 'In Progress' | 'Complete' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Pay Later';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface OrderItem {
  productId: string;
  name: string;
  category: string;
  unit: string;
  rate: number;
  qty: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerShop?: string;
  customerPhone: string;
  area: string;
  items: OrderItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  area: string;
  address: string;
  notes?: string;
  totalOrders: number;
  totalSpend: number;
  createdAt: string;
}

export interface UnitRateTier {
  unitName: string;
  conversionFactor: number; // relative to baseUnit (e.g. 1 kg = 1000 g, or 1 box = 12 pcs)
  rate: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  baseUnit: string;
  rate: number;
  units: UnitRateTier[];
  stock: number;
  isActive: boolean;
  sku?: string;
}

export interface CompanySettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxId: string; // GSTIN or VAT
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  orderPrefix: string;
  nextOrderSequence: number;
  invoiceFooterNote: string;
  upiId?: string;
  logoBase64?: string;
  adminPin: string;
  themePalette: string;
}

export interface ExceptionItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  item: string;
  category: string;
  orderedQty: number;
  actualQty: number;
  unit: string;
  issueType: 'Missing' | 'Damaged' | 'Rate Discrepancy' | 'Over Delivery';
  notes?: string;
  status: 'Unresolved' | 'Approved' | 'Dismissed';
  createdAt: string;
}

export interface DatabaseState {
  version: number;
  lastUpdated: string;
  settings: CompanySettings;
  categories: string[];
  commonUnits: string[];
  areas: string[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  exceptions: ExceptionItem[];
}
