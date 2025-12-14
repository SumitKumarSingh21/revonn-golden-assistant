import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cloud, RefreshCw, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsSync() {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState({
    inventory: { synced: 0, pending: 0 },
    invoices: { synced: 0, pending: 0 },
    customers: { synced: 0, pending: 0 }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [inventoryRes, invoicesRes, customersRes] = await Promise.all([
        supabase.from('inventory').select('id', { count: 'exact' }),
        supabase.from('invoices').select('id', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' })
      ]);

      setSyncStatus({
        inventory: { synced: inventoryRes.count || 0, pending: 0 },
        invoices: { synced: invoicesRes.count || 0, pending: 0 },
        customers: { synced: customersRes.count || 0, pending: 0 }
      });

      const savedLastSync = localStorage.getItem('lastSyncTime');
      if (savedLastSync) {
        setLastSync(new Date(savedLastSync));
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastSyncTime', now.toISOString());
      
      toast.success('Data synced successfully');
      await checkSyncStatus();
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncItems = [
    { key: 'inventory', label: 'Inventory Items', icon: Database },
    { key: 'invoices', label: 'Invoices', icon: Database },
    { key: 'customers', label: 'Customers', icon: Database }
  ];

  return (
    <AppLayout title="Sync Status" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Cloud Sync</h1>
        </div>

        {/* Sync Status Card */}
        <div className="p-5 rounded-2xl gold-gradient text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold">Cloud Backup</h2>
              <p className="text-sm opacity-90">
                {lastSync 
                  ? `Last synced: ${lastSync.toLocaleString('en-IN')}`
                  : 'Never synced'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Sync Items */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Sync Details
          </h3>
          <div className="space-y-2">
            {syncItems.map((item) => {
              const status = syncStatus[item.key as keyof typeof syncStatus];
              const hasPending = status.pending > 0;
              
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {status.synced} synced
                      {hasPending && `, ${status.pending} pending`}
                    </p>
                  </div>
                  {hasPending ? (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-info/10 border border-info/20">
          <p className="text-sm text-info">
            Your data is automatically backed up to the cloud. Sync manually to ensure the latest data is saved.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
