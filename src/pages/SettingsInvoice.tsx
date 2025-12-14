import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const invoiceTemplates = [
  { id: 'a4', name: 'A4 Standard', description: 'Full page GST invoice', size: 'A4' },
  { id: 'thermal', name: 'Thermal (80mm)', description: 'POS thermal printer', size: '80mm' },
  { id: 'compact', name: 'Compact A5', description: 'Half page invoice', size: 'A5' }
];

export default function SettingsInvoice() {
  const navigate = useNavigate();
  const { shopSettings, setShopSettings } = useAppStore();
  
  const [settings, setSettings] = useState({
    invoicePrefix: shopSettings.invoicePrefix || 'INV',
    selectedTemplate: 'a4',
    showTaxBreakup: true,
    showHSN: true,
    footerText: 'Thank you for your business!'
  });

  const handleSave = () => {
    setShopSettings({
      ...shopSettings,
      invoicePrefix: settings.invoicePrefix
    });
    
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    toast.success('Invoice settings saved');
    navigate(-1);
  };

  return (
    <AppLayout title="Invoice Settings" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Invoice Settings</h1>
        </div>

        {/* Invoice Prefix */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Invoice Prefix
          </label>
          <input
            type="text"
            value={settings.invoicePrefix}
            onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
            placeholder="INV"
            className="input-field"
            maxLength={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example: {settings.invoicePrefix}-2501-0001
          </p>
        </div>

        {/* Invoice Templates */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Invoice Template
          </label>
          <div className="space-y-2">
            {invoiceTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSettings({ ...settings, selectedTemplate: template.id })}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border transition-all",
                  settings.selectedTemplate === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
                {settings.selectedTemplate === template.id && (
                  <div className="p-1 rounded-full bg-primary">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Display Options
          </label>
          
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">Show Tax Breakup</p>
              <p className="text-xs text-muted-foreground">Display CGST/SGST separately</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, showTaxBreakup: !settings.showTaxBreakup })}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                settings.showTaxBreakup ? "bg-primary" : "bg-secondary"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all",
                settings.showTaxBreakup ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">Show HSN Codes</p>
              <p className="text-xs text-muted-foreground">Display HSN for each item</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, showHSN: !settings.showHSN })}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                settings.showHSN ? "bg-primary" : "bg-secondary"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all",
                settings.showHSN ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Invoice Footer Text
          </label>
          <textarea
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
            className="input-field min-h-[80px] resize-none"
            placeholder="Thank you for your business!"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-xl btn-gold font-semibold text-lg"
        >
          Save Settings
        </button>
      </div>
    </AppLayout>
  );
}
