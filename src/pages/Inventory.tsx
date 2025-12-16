import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Upload,
  Package,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Flame
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  price: number;
  gst_rate: number;
  sales_count: number;
  size: string | null;
  color: string | null;
  last_sold_at: string | null;
}

type FilterType = 'all' | 'low-stock' | 'top-selling';

export default function Inventory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', session.user.id)
        .order('sales_count', { ascending: false });

      if (error) throw error;
      setItems(data || []);
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
      return matchesSearch && item.quantity <= 5;
    }
    
    if (filter === 'top-selling') {
      return matchesSearch && item.sales_count > 0;
    }
    
    return matchesSearch;
  });

  // Sort by sales_count for top-selling filter
  const sortedItems = filter === 'top-selling' 
    ? [...filteredItems].sort((a, b) => b.sales_count - a.sales_count)
    : filteredItems;

  const lowStockCount = items.filter(i => i.quantity <= 5).length;
  const topSellingCount = items.filter(i => i.sales_count > 0).length;

  return (
    <AppLayout title={t('inventory')}>
      <div className="px-4 py-4 space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_items')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link
            to="/inventory/add"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('add_item')}
          </Link>
          <Link
            to="/inventory/upload"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
          >
            <Upload className="w-4 h-4" />
            {t('upload_bom')}
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {t('all')} ({items.length})
          </button>
          <button
            onClick={() => setFilter('top-selling')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1',
              filter === 'top-selling' 
                ? 'bg-warning text-warning-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Flame className="w-3 h-3" />
            {t('top_selling')} ({topSellingCount})
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              filter === 'low-stock' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {t('low_stock')} ({lowStockCount})
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{t('loading_inventory')}</p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{t('no_items_found')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {items.length === 0 
                  ? t('add_item') 
                  : t('search_items')}
              </p>
              {items.length === 0 && (
                <Link
                  to="/inventory/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  <Upload className="w-4 h-4" />
                  {t('upload_bom')}
                </Link>
              )}
            </div>
          ) : (
            sortedItems.map((item, index) => {
              const isLowStock = item.quantity <= 5;
              const isTopSeller = item.sales_count > 0 && index < 5 && filter !== 'low-stock';
              
              return (
                <Link
                  key={item.id}
                  to={`/inventory/${item.id}`}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center relative',
                    isLowStock ? 'bg-destructive/10' : isTopSeller ? 'bg-warning/10' : 'bg-secondary'
                  )}>
                    <Package className={cn(
                      'w-6 h-6',
                      isLowStock ? 'text-destructive' : isTopSeller ? 'text-warning' : 'text-muted-foreground'
                    )} />
                    {isTopSeller && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                      {isLowStock && (
                        <span className="badge-low-stock flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t('low_stock')}
                        </span>
                      )}
                      {isTopSeller && !isLowStock && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning/10 text-warning flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {item.sales_count} {t('sold')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.sku && `${item.sku} • `}
                      {t('stock')}: {item.quantity} • {formatCurrency(Number(item.price))}
                    </p>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
