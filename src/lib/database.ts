import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  InventoryItem, 
  Customer, 
  Invoice, 
  PurchaseEntry, 
  Expense, 
  CashEntry,
  Staff,
  Attendance,
  StockAdjustment,
  SyncQueueItem,
  Reminder,
  User
} from '@/types';

interface RevonnDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-phone': string };
  };
  inventory: {
    key: string;
    value: InventoryItem;
    indexes: { 'by-category': string; 'by-vendor': string; 'by-name': string };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-phone': string; 'by-name': string };
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-date': Date; 'by-customer': string; 'by-status': string };
  };
  purchases: {
    key: string;
    value: PurchaseEntry;
    indexes: { 'by-date': Date; 'by-vendor': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-date': Date; 'by-category': string };
  };
  cashEntries: {
    key: string;
    value: CashEntry;
    indexes: { 'by-date': Date; 'by-type': string };
  };
  staff: {
    key: string;
    value: Staff;
    indexes: { 'by-phone': string };
  };
  attendance: {
    key: string;
    value: Attendance;
    indexes: { 'by-staff': string; 'by-date': Date };
  };
  stockAdjustments: {
    key: string;
    value: StockAdjustment;
    indexes: { 'by-item': string; 'by-date': Date };
  };
  reminders: {
    key: string;
    value: Reminder;
    indexes: { 'by-customer': string; 'by-date': Date };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-table': string };
  };
  settings: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'revonn-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RevonnDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<RevonnDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RevonnDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-phone', 'phone');
      }

      // Inventory store
      if (!db.objectStoreNames.contains('inventory')) {
        const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
        invStore.createIndex('by-category', 'category');
        invStore.createIndex('by-vendor', 'vendor');
        invStore.createIndex('by-name', 'name');
      }

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const custStore = db.createObjectStore('customers', { keyPath: 'id' });
        custStore.createIndex('by-phone', 'phone');
        custStore.createIndex('by-name', 'name');
      }

      // Invoices store
      if (!db.objectStoreNames.contains('invoices')) {
        const invStore = db.createObjectStore('invoices', { keyPath: 'id' });
        invStore.createIndex('by-date', 'createdAt');
        invStore.createIndex('by-customer', 'customerId');
        invStore.createIndex('by-status', 'status');
      }

      // Purchases store
      if (!db.objectStoreNames.contains('purchases')) {
        const purchStore = db.createObjectStore('purchases', { keyPath: 'id' });
        purchStore.createIndex('by-date', 'date');
        purchStore.createIndex('by-vendor', 'vendorName');
      }

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expStore.createIndex('by-date', 'date');
        expStore.createIndex('by-category', 'category');
      }

      // Cash entries store
      if (!db.objectStoreNames.contains('cashEntries')) {
        const cashStore = db.createObjectStore('cashEntries', { keyPath: 'id' });
        cashStore.createIndex('by-date', 'date');
        cashStore.createIndex('by-type', 'type');
      }

      // Staff store
      if (!db.objectStoreNames.contains('staff')) {
        const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
        staffStore.createIndex('by-phone', 'phone');
      }

      // Attendance store
      if (!db.objectStoreNames.contains('attendance')) {
        const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
        attStore.createIndex('by-staff', 'staffId');
        attStore.createIndex('by-date', 'date');
      }

      // Stock adjustments store
      if (!db.objectStoreNames.contains('stockAdjustments')) {
        const adjStore = db.createObjectStore('stockAdjustments', { keyPath: 'id' });
        adjStore.createIndex('by-item', 'itemId');
        adjStore.createIndex('by-date', 'createdAt');
      }

      // Reminders store
      if (!db.objectStoreNames.contains('reminders')) {
        const remStore = db.createObjectStore('reminders', { keyPath: 'id' });
        remStore.createIndex('by-customer', 'customerId');
        remStore.createIndex('by-date', 'scheduledFor');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-table', 'table');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Generic CRUD operations
export const db = {
  // Inventory
  inventory: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('inventory');
    },
    get: async (id: string) => {
      const database = await getDB();
      return database.get('inventory', id);
    },
    add: async (item: InventoryItem) => {
      const database = await getDB();
      await database.add('inventory', item);
      await addToSyncQueue('inventory', item.id, 'create', item);
    },
    update: async (item: InventoryItem) => {
      const database = await getDB();
      await database.put('inventory', item);
      await addToSyncQueue('inventory', item.id, 'update', item);
    },
    delete: async (id: string) => {
      const database = await getDB();
      await database.delete('inventory', id);
      await addToSyncQueue('inventory', id, 'delete', { id });
    },
    getByCategory: async (category: string) => {
      const database = await getDB();
      return database.getAllFromIndex('inventory', 'by-category', category);
    },
    getLowStock: async () => {
      const items = await db.inventory.getAll();
      return items.filter(item => {
        const totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);
        return totalStock <= item.lowStockThreshold;
      });
    }
  },

  // Customers
  customers: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('customers');
    },
    get: async (id: string) => {
      const database = await getDB();
      return database.get('customers', id);
    },
    add: async (customer: Customer) => {
      const database = await getDB();
      await database.add('customers', customer);
      await addToSyncQueue('customers', customer.id, 'create', customer);
    },
    update: async (customer: Customer) => {
      const database = await getDB();
      await database.put('customers', customer);
      await addToSyncQueue('customers', customer.id, 'update', customer);
    },
    delete: async (id: string) => {
      const database = await getDB();
      await database.delete('customers', id);
      await addToSyncQueue('customers', id, 'delete', { id });
    },
    getByPhone: async (phone: string) => {
      const database = await getDB();
      return database.getFromIndex('customers', 'by-phone', phone);
    }
  },

  // Invoices
  invoices: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('invoices');
    },
    get: async (id: string) => {
      const database = await getDB();
      return database.get('invoices', id);
    },
    add: async (invoice: Invoice) => {
      const database = await getDB();
      await database.add('invoices', invoice);
      await addToSyncQueue('invoices', invoice.id, 'create', invoice);
    },
    update: async (invoice: Invoice) => {
      const database = await getDB();
      await database.put('invoices', invoice);
      await addToSyncQueue('invoices', invoice.id, 'update', invoice);
    },
    getToday: async () => {
      const invoices = await db.invoices.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return invoices.filter(inv => new Date(inv.createdAt) >= today);
    },
    getByDateRange: async (start: Date, end: Date) => {
      const invoices = await db.invoices.getAll();
      return invoices.filter(inv => {
        const date = new Date(inv.createdAt);
        return date >= start && date <= end;
      });
    }
  },

  // Purchases
  purchases: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('purchases');
    },
    add: async (purchase: PurchaseEntry) => {
      const database = await getDB();
      await database.add('purchases', purchase);
      await addToSyncQueue('purchases', purchase.id, 'create', purchase);
    },
    getByVendor: async (vendor: string) => {
      const database = await getDB();
      return database.getAllFromIndex('purchases', 'by-vendor', vendor);
    }
  },

  // Expenses
  expenses: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('expenses');
    },
    add: async (expense: Expense) => {
      const database = await getDB();
      await database.add('expenses', expense);
      await addToSyncQueue('expenses', expense.id, 'create', expense);
    },
    getToday: async () => {
      const expenses = await db.expenses.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expenses.filter(exp => new Date(exp.date) >= today);
    }
  },

  // Cash Entries
  cashEntries: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('cashEntries');
    },
    add: async (entry: CashEntry) => {
      const database = await getDB();
      await database.add('cashEntries', entry);
      await addToSyncQueue('cashEntries', entry.id, 'create', entry);
    },
    getToday: async () => {
      const entries = await db.cashEntries.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return entries.filter(e => new Date(e.date) >= today);
    }
  },

  // Settings
  settings: {
    get: async (key: string) => {
      const database = await getDB();
      const result = await database.get('settings', key);
      return result?.value;
    },
    set: async (key: string, value: any) => {
      const database = await getDB();
      await database.put('settings', { key, value });
    }
  },

  // Staff
  staff: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('staff');
    },
    add: async (member: Staff) => {
      const database = await getDB();
      await database.add('staff', member);
    },
    update: async (member: Staff) => {
      const database = await getDB();
      await database.put('staff', member);
    }
  },

  // Sync Queue
  syncQueue: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll('syncQueue');
    },
    clear: async () => {
      const database = await getDB();
      await database.clear('syncQueue');
    }
  }
};

// Add item to sync queue
async function addToSyncQueue(table: string, recordId: string, action: 'create' | 'update' | 'delete', data: any) {
  const database = await getDB();
  const queueItem: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    table,
    recordId,
    action,
    data,
    createdAt: new Date(),
    attempts: 0
  };
  await database.add('syncQueue', queueItem);
}

// Calculate daily summary
export async function getDailySummary(date: Date = new Date()): Promise<{
  totalSales: number;
  totalItemsSold: number;
  totalCashIn: number;
  totalCashOut: number;
  totalExpenses: number;
  grossProfit: number;
  taxCollected: number;
  invoiceCount: number;
}> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const invoices = await db.invoices.getByDateRange(startOfDay, endOfDay);
  const expenses = await db.expenses.getToday();
  const cashEntries = await db.cashEntries.getToday();

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalItemsSold = invoices.reduce((sum, inv) => 
    sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const taxCollected = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);
  const costOfGoods = invoices.reduce((sum, inv) => {
    // For now, estimate COGS as 60% of revenue (will be accurate once we track purchase prices)
    return sum + (inv.grandTotal - inv.totalTax) * 0.6;
  }, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCashIn = cashEntries.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0) + totalExpenses;

  return {
    totalSales,
    totalItemsSold,
    totalCashIn: totalCashIn + totalSales,
    totalCashOut,
    totalExpenses,
    grossProfit: totalSales - taxCollected - costOfGoods,
    taxCollected,
    invoiceCount: invoices.length
  };
}

// Backup & Restore
export async function exportBackup(): Promise<string> {
  const database = await getDB();
  
  const backup = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      inventory: await database.getAll('inventory'),
      customers: await database.getAll('customers'),
      invoices: await database.getAll('invoices'),
      purchases: await database.getAll('purchases'),
      expenses: await database.getAll('expenses'),
      cashEntries: await database.getAll('cashEntries'),
      staff: await database.getAll('staff'),
      attendance: await database.getAll('attendance'),
      stockAdjustments: await database.getAll('stockAdjustments'),
      reminders: await database.getAll('reminders'),
      settings: await database.getAll('settings')
    }
  };

  return JSON.stringify(backup, null, 2);
}

export async function importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const backup = JSON.parse(jsonString);
    const database = await getDB();

    // Clear existing data
    const stores = ['inventory', 'customers', 'invoices', 'purchases', 'expenses', 
                    'cashEntries', 'staff', 'attendance', 'stockAdjustments', 'reminders', 'settings'] as const;
    
    for (const store of stores) {
      await database.clear(store);
      if (backup.data[store]) {
        for (const item of backup.data[store]) {
          await database.add(store, item);
        }
      }
    }

    return { success: true, message: `Restored ${Object.keys(backup.data).length} data stores` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Import failed' };
  }
}

export default db;
