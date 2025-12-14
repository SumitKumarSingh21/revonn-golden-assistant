import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Phone, 
  MessageSquare, 
  CreditCard,
  Calendar,
  IndianRupee,
  AlertCircle,
  Send
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  total_purchases: number;
  total_dues: number;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  payment_mode: string;
  due_amount: number;
  created_at: string;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Load customer invoices
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (invoiceError) throw invoiceError;
      setInvoices(invoiceData || []);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  };

  const sendDueReminder = () => {
    if (!customer?.phone) {
      toast.error('Customer phone number not available');
      return;
    }

    const message = encodeURIComponent(
      `Hi ${customer.name},\n\nThis is a friendly reminder about your pending dues of ${formatCurrency(customer.total_dues)} at our store.\n\nPlease clear your dues at your earliest convenience.\n\nThank you!`
    );

    window.open(`https://wa.me/91${customer.phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <AppLayout title="Customer" hideNav>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout title="Customer" hideNav>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Customer not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Customer" hideNav>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Customer Details</h1>
        </div>

        {/* Customer Card */}
        <div className="p-5 rounded-2xl gold-gradient text-primary-foreground">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold">{customer.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{customer.name}</h2>
              {customer.phone && (
                <p className="text-sm opacity-90 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  +91 {customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <p className="text-xs opacity-80">Total Purchases</p>
              <p className="text-lg font-bold">{formatCurrency(Number(customer.total_purchases) || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
              <p className="text-xs opacity-80">Outstanding Dues</p>
              <p className={cn("text-lg font-bold", Number(customer.total_dues) > 0 && "text-yellow-200")}>
                {formatCurrency(Number(customer.total_dues) || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Due Reminder Button */}
        {Number(customer.total_dues) > 0 && (
          <button
            onClick={sendDueReminder}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-warning/10 text-warning font-medium border border-warning/30"
          >
            <Send className="w-4 h-4" />
            Send Due Reminder via WhatsApp
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          {customer.phone && (
            <a
              href={`tel:+91${customer.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary font-medium"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          {customer.phone && (
            <a
              href={`https://wa.me/91${customer.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/10 text-success font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          )}
        </div>

        {/* Purchase History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Purchase History
          </h3>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No purchases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] uppercase">
                        {invoice.payment_mode}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(Number(invoice.total))}</p>
                    {Number(invoice.due_amount) > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Due: {formatCurrency(Number(invoice.due_amount))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
