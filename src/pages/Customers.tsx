import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Phone,
  ChevronRight,
  Users as UsersIcon,
  AlertCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
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
  total_purchases: number;
  total_dues: number;
  created_at: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const totalDues = customers.reduce((sum, c) => sum + Number(c.total_dues || 0), 0);

  return (
    <AppLayout title="Customers">
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <Link
            to="/customers/add"
            className="p-3 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-foreground">{customers.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-success">
              {customers.filter(c => Number(c.total_dues) === 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Clear</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-xl font-bold text-destructive">
              {formatCurrency(totalDues)}
            </p>
            <p className="text-xs text-muted-foreground">Total Dues</p>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No customers found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {customers.length === 0 
                  ? "Start by adding your first customer" 
                  : "Try a different search term"}
              </p>
              {customers.length === 0 && (
                <Link
                  to="/customers/add"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Link>
              )}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{customer.name}</h3>
                    {Number(customer.total_dues) > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Due
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone || 'No phone'}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-muted-foreground">
                      Purchases: {formatCurrency(Number(customer.total_purchases) || 0)}
                    </span>
                    {Number(customer.total_dues) > 0 && (
                      <span className="text-destructive font-medium">
                        Dues: {formatCurrency(Number(customer.total_dues))}
                      </span>
                    )}
                  </div>
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
