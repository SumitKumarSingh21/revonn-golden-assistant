import { useState, useEffect } from 'react';
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
import { getDailySummary, db } from '@/lib/database';
import type { Invoice } from '@/types';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

type ViewMode = 'today' | 'week' | 'month';

export default function Reports() {
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let startDate = new Date(today);
      
      if (viewMode === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (viewMode === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      }
      startDate.setHours(0, 0, 0, 0);
      
      const dailySummary = await getDailySummary();
      const allInvoices = await db.invoices.getByDateRange(startDate, today);
      
      setSummary(dailySummary);
      setInvoices(allInvoices);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('en-IN');
      
      // Header
      doc.setFontSize(20);
      doc.text('Sales Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated on: ${today}`, 105, 30, { align: 'center' });
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);
      doc.setFontSize(11);
      doc.text(`Total Sales: ${formatCurrency(summary?.totalSales || 0)}`, 20, 60);
      doc.text(`Items Sold: ${summary?.totalItemsSold || 0}`, 20, 70);
      doc.text(`Invoices: ${summary?.invoiceCount || 0}`, 20, 80);
      doc.text(`Tax Collected: ${formatCurrency(summary?.taxCollected || 0)}`, 20, 90);
      doc.text(`Gross Profit: ${formatCurrency(summary?.grossProfit || 0)}`, 20, 100);
      
      // Save
      doc.save(`sales-report-${today.replace(/\//g, '-')}.pdf`);
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Error exporting report');
    }
  };

  const metrics = [
    { label: 'Total Sales', value: formatCurrency(summary?.totalSales || 0), icon: IndianRupee, color: 'text-primary' },
    { label: 'Items Sold', value: summary?.totalItemsSold || 0, icon: ShoppingBag, color: 'text-success' },
    { label: 'Cash In', value: formatCurrency(summary?.totalCashIn || 0), icon: TrendingUp, color: 'text-success' },
    { label: 'Cash Out', value: formatCurrency(summary?.totalCashOut || 0), icon: TrendingDown, color: 'text-destructive' },
  ];

  return (
    <AppLayout title="Reports">
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
              {mode === 'today' ? 'Today' : mode === 'week' ? '7 Days' : '30 Days'}
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
              <p className="text-sm opacity-90">Gross Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.grossProfit || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Tax Collected</p>
              <p className="text-lg font-semibold">{formatCurrency(summary?.taxCollected || 0)}</p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={exportPDF}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
        >
          <Download className="w-4 h-4" />
          Export Report as PDF
        </button>

        {/* Recent Invoices */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Invoices
          </h3>
          
          <div className="space-y-2">
            {invoices.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No invoices in this period</p>
              </div>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.customerName || 'Walk-in'} • {invoice.items.length} items
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(invoice.grandTotal)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
