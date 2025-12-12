import { create } from 'zustand';
import type { User, InventoryItem, Customer, Invoice, DailySummary } from '@/types';

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Dashboard data
  dailySummary: DailySummary | null;
  setDailySummary: (summary: DailySummary | null) => void;
  
  // Inventory
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  
  // Customers
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  
  // Recent invoices
  recentInvoices: Invoice[];
  setRecentInvoices: (invoices: Invoice[]) => void;
  
  // AI Assistant state
  isAIOpen: boolean;
  setIsAIOpen: (open: boolean) => void;
  
  // Settings
  shopSettings: {
    shopName: string;
    gstin: string;
    address: string;
    state: string;
    phone: string;
    invoicePrefix: string;
    autoWhatsApp: boolean;
  };
  setShopSettings: (settings: Partial<AppState['shopSettings']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  dailySummary: null,
  setDailySummary: (summary) => set({ dailySummary: summary }),
  
  inventory: [],
  setInventory: (items) => set({ inventory: items }),
  
  customers: [],
  setCustomers: (customers) => set({ customers }),
  
  recentInvoices: [],
  setRecentInvoices: (invoices) => set({ recentInvoices: invoices }),
  
  isAIOpen: false,
  setIsAIOpen: (open) => set({ isAIOpen: open }),
  
  shopSettings: {
    shopName: 'Revonn Demo Store',
    gstin: '27AABCU9603R1ZX',
    address: 'Mumbai, Maharashtra',
    state: 'Maharashtra',
    phone: '+919876543210',
    invoicePrefix: 'INV',
    autoWhatsApp: false
  },
  setShopSettings: (settings) => set((state) => ({
    shopSettings: { ...state.shopSettings, ...settings }
  }))
}));
