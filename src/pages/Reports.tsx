import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Download,
  ChevronRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

type ViewMode = 'today' | 'week' | 'month';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total: number;
  tax_amount: number;
  items: any;
  created_at: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('invoices-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const today = new Date();
      let startDate = new Date(today);
      
      if (viewMode === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (viewMode === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      }
      startDate.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalItemsSold = invoices.reduce((sum, inv) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
  }, 0);
  const taxCollected = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
  const grossProfit = totalSales - taxCollected - (totalSales * 0.6); // Estimate COGS at 60%

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('en-IN');
      
      doc.setFontSize(20);
      doc.text('Sales Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated on: ${today}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);
      doc.setFontSize(11);
      doc.text(`Total Sales: ${formatCurrency(totalSales)}`, 20, 60);
      doc.text(`Items Sold: ${totalItemsSold}`, 20, 70);
      doc.text(`Invoices: ${invoices.length}`, 20, 80);
      doc.text(`Tax Collected: ${formatCurrency(taxCollected)}`, 20, 90);
      doc.text(`Gross Profit: ${formatCurrency(grossProfit)}`, 20, 100);
      
      doc.save(`sales-report-${today.replace(/\//g, '-')}.pdf`);
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Error exporting report');
    }
  };

  const metrics = [
    { label: t('total_sales'), value: formatCurrency(totalSales), icon: IndianRupee, color: 'text-primary' },
    { label: t('items_sold'), value: totalItemsSold, icon: ShoppingBag, color: 'text-success' },
    { label: t('cash_in'), value: formatCurrency(totalSales), icon: TrendingUp, color: 'text-success' },
    { label: t('tax_collected'), value: formatCurrency(taxCollected), icon: TrendingDown, color: 'text-destructive' },
  ];

  return (
    <AppLayout title={t('reports')}>
      <div className="px-4 py-4 space-y-4">
        {/* View Mode Selector */}
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          {(['today', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize',
                viewMode === mode 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground'
              )}
            >
              {mode === 'today' ? t('today') : mode === 'week' ? t('days_7') : t('days_30')}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', color)} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Profit Card */}
        <div className="p-4 rounded-xl gold-gradient text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('gross_profit')}</p>
              <p className="text-2xl font-bold">{formatCurrency(grossProfit)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">{t('tax_collected')}</p>
              <p className="text-lg font-semibold">{formatCurrency(taxCollected)}</p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={exportPDF}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
        >
          <Download className="w-4 h-4" />
          {t('export_report')}
        </button>

        {/* Recent Invoices */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('recent_invoices')}
          </h3>
          
          <div className="space-y-2">
            {invoices.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('no_invoices_period')}</p>
              </div>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:shadow-md transition-all"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.customer_name || t('walk_in_customer')} • {Array.isArray(invoice.items) ? invoice.items.length : 0} {t('items')}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(Number(invoice.total))}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
