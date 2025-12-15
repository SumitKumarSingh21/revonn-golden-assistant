import { create } from 'zustand';
import type { User, InventoryItem, Customer, Invoice, DailySummary } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
  loadUserSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
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
    shopName: 'My Shop',
    gstin: '',
    address: '',
    state: '',
    phone: '',
    invoicePrefix: 'INV',
    autoWhatsApp: false
  },
  setShopSettings: (settings) => set((state) => ({
    shopSettings: { ...state.shopSettings, ...settings }
  })),
  
  loadUserSettings: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user metadata from auth
      const userMeta = session.user.user_metadata;
      
      // Try to get profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      set((state) => ({
        shopSettings: {
          ...state.shopSettings,
          shopName: profile?.shop_name || userMeta?.shop_name || 'My Shop',
          gstin: profile?.gstin || userMeta?.gstin || '',
          address: profile?.address || '',
          phone: profile?.phone || userMeta?.phone || '',
        }
      }));
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }
}));