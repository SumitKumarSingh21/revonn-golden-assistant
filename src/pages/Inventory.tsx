import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Upload,
  Package,
  AlertTriangle,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import type { InventoryItem } from '@/types';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const inventory = await db.inventory.getAll();
      setItems(inventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'low-stock') {
      const totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);
      return matchesSearch && totalStock <= item.lowStockThreshold;
    }
    
    return matchesSearch;
  });

  const getTotalStock = (item: InventoryItem) => {
    return item.variants.reduce((sum, v) => sum + v.stock, 0);
  };

  const isLowStock = (item: InventoryItem) => {
    return getTotalStock(item) <= item.lowStockThreshold;
  };

  return (
    <AppLayout title="Inventory">
      <div className="px-4 py-4 space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setFilter(filter === 'all' ? 'low-stock' : 'all')}
            className={cn(
              'p-3 rounded-xl transition-colors',
              filter === 'low-stock' 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link
            to="/inventory/add"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
          <Link
            to="/inventory/upload"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload BOM
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === 'low-stock' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            Low Stock ({items.filter(isLowStock).length})
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {items.length === 0 
                  ? "Start by adding items or uploading a BOM" 
                  : "Try a different search term"}
              </p>
              {items.length === 0 && (
                <Link
                  to="/inventory/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload BOM
                </Link>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <Link
                key={item.id}
                to={`/inventory/${item.id}`}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  isLowStock(item) ? 'bg-destructive/10' : 'bg-secondary'
                )}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package className={cn(
                      'w-6 h-6',
                      isLowStock(item) ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                    {isLowStock(item) && (
                      <span className="badge-low-stock flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.sku && `${item.sku} • `}
                    Stock: {getTotalStock(item)} • {formatCurrency(item.sellingPrice)}
                  </p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
