import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Store,
  FileText,
  Bell,
  Database,
  Shield,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Cloud,
  Download,
  Upload
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/app-store';
import { exportBackup, importBackup } from '@/lib/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { shopSettings, setShopSettings } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await exportBackup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revonn-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported successfully!');
    } catch (error) {
      toast.error('Error exporting backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const result = await importBackup(text);
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Error importing backup');
      }
    };
    input.click();
  };

  const sections = [
    {
      title: 'Business',
      items: [
        { icon: Store, label: 'Shop Profile', description: 'Name, GSTIN, Address', path: '/settings/shop' },
        { icon: FileText, label: 'Invoice Settings', description: 'Prefix, templates', path: '/settings/invoice' },
      ]
    },
    {
      title: 'Features',
      items: [
        { icon: Sparkles, label: 'AI Assistant', description: 'Mock AI / Real AI toggle', path: '/settings/ai' },
        { icon: Bell, label: 'Notifications', description: 'Alerts & reminders', path: '/settings/notifications' },
      ]
    },
    {
      title: 'Data',
      items: [
        { icon: Database, label: 'Backup & Restore', description: 'Export/import your data', action: 'backup' },
        { icon: Cloud, label: 'Sync Status', description: 'Pending: 0 items', path: '/settings/sync' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & FAQ', description: 'Get help using Revonn', path: '/help' },
        { icon: Shield, label: 'Privacy & Security', description: 'Data protection', path: '/settings/privacy' },
      ]
    },
  ];

  return (
    <AppLayout title="Settings" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Shop Info Card */}
        <div className="p-4 rounded-2xl gold-gradient text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold">{shopSettings.shopName}</h2>
              <p className="text-sm opacity-90">{shopSettings.gstin}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action === 'backup') {
                      // Show backup options
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left',
                    index !== section.items.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Backup Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
          >
            <Download className="w-4 h-4" />
            Export Backup
          </button>
          <button
            onClick={handleImportBackup}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
          >
            <Upload className="w-4 h-4" />
            Import Backup
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Revonn v1.0.0 • Phase 1
        </p>
      </div>
    </AppLayout>
  );
}
