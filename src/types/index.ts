// Core Types for Revonn App

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'staff';
  pin?: string;
  shopName?: string;
  gstin?: string;
  address?: string;
  state?: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  hsn?: string;
  variants: ItemVariant[];
  vendor?: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number; // GST %
  lowStockThreshold: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemVariant {
  id: string;
  size?: string;
  color?: string;
  stock: number;
  sku?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tags: CustomerTag[];
  outstandingCredit: number;
  createdAt: Date;
}

export type CustomerTag = 'Regular' | 'VIP' | 'New' | 'Wholesale';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  taxBreakup: TaxBreakup;
  totalTax: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  paidAmount: number;
  status: 'paid' | 'partial' | 'credit';
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  itemName: string;
  variantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface TaxBreakup {
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
}

export interface PurchaseEntry {
  id: string;
  vendorName: string;
  vendorInvoiceNo?: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  variantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface CashEntry {
  id: string;
  type: 'in' | 'out';
  category: string;
  description: string;
  amount: number;
  date: Date;
  relatedInvoiceId?: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: 'staff' | 'manager';
  pin: string;
  baseSalary: number;
  salaryType: 'monthly' | 'daily';
  createdAt: Date;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day';
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  variantId?: string;
  previousQty: number;
  newQty: number;
  reason: string;
  createdAt: Date;
}

export interface BOMRow {
  name: string;
  quantity: number;
  unitCost: number;
  sku?: string;
  size?: string;
  color?: string;
  vendor?: string;
  hsn?: string;
  action: 'create' | 'update' | 'ignore';
  matchedItemId?: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalItemsSold: number;
  totalCashIn: number;
  totalCashOut: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  taxCollected: number;
  invoiceCount: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: AIAction;
}

export interface AIAction {
  type: 'create_bill' | 'check_stock' | 'generate_message' | 'show_report';
  data?: any;
}

export interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  message: string;
  scheduledFor: Date;
  completed: boolean;
  createdAt: Date;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: Date;
  attempts: number;
}
