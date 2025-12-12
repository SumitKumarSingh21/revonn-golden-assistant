import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  ShoppingBag, 
  ArrowDownCircle, 
  ArrowUpCircle,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  FileText,
  Upload,
  Users as UsersIcon
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { getDailySummary, db } from '@/lib/database';
import { useAppStore } from '@/store/app-store';
import type { DailySummary, InventoryItem } from '@/types';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function Dashboard() {
  const { shopSettings } = useAppStore();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dailySummary, lowStock] = await Promise.all([
        getDailySummary(),
        db.inventory.getLowStock()
      ]);
      setSummary(dailySummary as any);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: Plus, label: 'New Bill', path: '/billing/new', color: 'bg-primary text-primary-foreground' },
    { icon: Upload, label: 'Upload BOM', path: '/inventory/upload', color: 'bg-secondary text-secondary-foreground' },
    { icon: Package, label: 'Add Stock', path: '/inventory/add', color: 'bg-secondary text-secondary-foreground' },
    { icon: UsersIcon, label: 'Add Customer', path: '/customers/add', color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
          </h2>
          <p className="text-muted-foreground">{shopSettings.shopName}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {quickActions.map(({ icon: Icon, label, path, color }) => (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card hover:shadow-md transition-all duration-200"
            >
              <div className={cn('p-3 rounded-xl', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Today's Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <KPICard
              title="Total Sales"
              value={formatCurrency(summary?.totalSales || 0)}
              icon={<IndianRupee className="w-5 h-5" />}
              trend="up"
              trendValue="+12%"
              variant="primary"
            />
            <KPICard
              title="Items Sold"
              value={summary?.totalItemsSold || 0}
              subtitle={`${summary?.invoiceCount || 0} invoices`}
              icon={<ShoppingBag className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              title="Cash In"
              value={formatCurrency(summary?.totalCashIn || 0)}
              icon={<ArrowDownCircle className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              title="Cash Out"
              value={formatCurrency(summary?.totalCashOut || 0)}
              icon={<ArrowUpCircle className="w-5 h-5" />}
              variant="warning"
            />
          </div>

          {/* Profit Card */}
          <div 
            className="kpi-card gold-gradient text-primary-foreground animate-slide-up" 
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Today's Profit</p>
                <h3 className="text-3xl font-bold mt-1">
                  {formatCurrency(summary?.grossProfit || 0)}
                </h3>
                <p className="text-xs opacity-80 mt-1">
                  Tax Collected: {formatCurrency(summary?.taxCollected || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Low Stock Alerts
              </h3>
              <Link to="/inventory?filter=low-stock" className="text-xs text-primary font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => {
                const totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                  >
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Only {totalStock} left • Threshold: {item.lowStockThreshold}
                      </p>
                    </div>
                    <Link
                      to={`/inventory/${item.id}`}
                      className="text-xs font-medium text-primary"
                    >
                      Restock
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity placeholder */}
        <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Bills
            </h3>
            <Link to="/reports" className="text-xs text-primary font-medium">
              View All
            </Link>
          </div>
          
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No bills today yet</p>
            <Link to="/billing/new" className="text-sm text-primary font-medium mt-2 inline-block">
              Create your first bill
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
