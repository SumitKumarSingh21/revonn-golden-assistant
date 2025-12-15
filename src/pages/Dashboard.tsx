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
  FileText,
  Users as UsersIcon,
  Receipt,
  BarChart3,
  MessageSquare,
  UserCog,
  Clock
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total: number;
  items: any;
  created_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  sales_count: number;
}

export default function Dashboard() {
  const { shopSettings, loadUserSettings } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserSettings();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get today's start
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      setInvoices(invoicesData || []);

      // Load inventory for low stock
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', session.user.id);

      setInventory(inventoryData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalItemsSold = invoices.reduce((sum, inv) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
  }, 0);
  const taxCollected = invoices.reduce((sum, inv) => sum + Number((inv as any).tax_amount || 0), 0);
  const lowStockItems = inventory.filter(item => Number(item.quantity) <= 5);
  const topSellingItems = inventory
    .filter(item => Number(item.sales_count) > 0)
    .sort((a, b) => Number(b.sales_count) - Number(a.sales_count))
    .slice(0, 5);

  const mainTabs = [
    { icon: Receipt, label: 'Bill', path: '/billing/new', color: 'bg-primary text-primary-foreground', active: true },
    { icon: Package, label: 'Inventory', path: '/inventory', color: 'bg-secondary text-foreground', active: true },
    { icon: BarChart3, label: 'Finance', path: '/reports', color: 'bg-secondary text-foreground', active: true },
    { icon: UsersIcon, label: 'Customer', path: '/customers', color: 'bg-secondary text-foreground', active: true },
    { icon: FileText, label: 'GST', path: '/gst', color: 'bg-muted text-muted-foreground', active: false, comingSoon: true },
    { icon: MessageSquare, label: 'Marketing', path: '/marketing', color: 'bg-muted text-muted-foreground', active: false, comingSoon: true },
    { icon: UserCog, label: 'Staff', path: '/staff', color: 'bg-secondary text-foreground', active: true },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-5">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
          </h2>
          <p className="text-muted-foreground">{shopSettings.shopName}</p>
        </div>

        {/* Main 7 Tabs */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {mainTabs.slice(0, 4).map(({ icon: Icon, label, path, color, active, comingSoon }) => (
              <Link
                key={path}
                to={active ? path : '#'}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-200",
                  !active && "opacity-60 cursor-not-allowed"
                )}
                onClick={(e) => !active && e.preventDefault()}
              >
                <div className={cn('p-3 rounded-xl', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center text-foreground">{label}</span>
                {comingSoon && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full">Soon</span>
                )}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {mainTabs.slice(4).map(({ icon: Icon, label, path, color, active, comingSoon }) => (
              <Link
                key={path}
                to={active ? path : '#'}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-200",
                  !active && "opacity-60 cursor-not-allowed"
                )}
                onClick={(e) => !active && e.preventDefault()}
              >
                <div className={cn('p-3 rounded-xl', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center text-foreground">{label}</span>
                {comingSoon && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full">Soon</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Today's Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <KPICard
              title="Total Sales"
              value={formatCurrency(totalSales)}
              icon={<IndianRupee className="w-5 h-5" />}
              trend="up"
              trendValue="+12%"
              variant="primary"
            />
            <KPICard
              title="Items Sold"
              value={totalItemsSold}
              subtitle={`${invoices.length} invoices`}
              icon={<ShoppingBag className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              title="Cash In"
              value={formatCurrency(totalSales)}
              icon={<ArrowDownCircle className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              title="Tax Collected"
              value={formatCurrency(taxCollected)}
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
                <p className="text-sm opacity-90">Today's Revenue</p>
                <h3 className="text-3xl font-bold mt-1">
                  {formatCurrency(totalSales)}
                </h3>
                <p className="text-xs opacity-80 mt-1">
                  Tax Collected: {formatCurrency(taxCollected)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        {topSellingItems.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                🔥 Top Selling Items
              </h3>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              {topSellingItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{item.sales_count} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
              {lowStockItems.slice(0, 3).map((item) => (
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
                      Only {item.quantity} left
                    </p>
                  </div>
                  <Link
                    to={`/inventory`}
                    className="text-xs font-medium text-primary"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Bills */}
        <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Bills
            </h3>
            <Link to="/reports" className="text-xs text-primary font-medium">
              View All
            </Link>
          </div>
          
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.slice(0, 5).map((invoice) => {
                const items = Array.isArray(invoice.items) ? invoice.items : [];
                return (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-md transition-all"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Receipt className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {invoice.customer_name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(invoice.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {' • '}{items.length} items
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(Number(invoice.total))}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No bills today yet</p>
              <Link to="/billing/new" className="text-sm text-primary font-medium mt-2 inline-block">
                Create your first bill
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}