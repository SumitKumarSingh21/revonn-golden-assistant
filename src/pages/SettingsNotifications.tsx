import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, MessageSquare, AlertTriangle, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsNotifications() {
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    lowStockAlerts: true,
    dueReminders: true,
    dailySummary: false,
    whatsappNotifications: true
  });

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    toast.success('Notification settings saved');
    navigate(-1);
  };

  const notificationOptions = [
    {
      key: 'lowStockAlerts',
      icon: AlertTriangle,
      title: 'Low Stock Alerts',
      description: 'Get notified when items run low'
    },
    {
      key: 'dueReminders',
      icon: CreditCard,
      title: 'Due Payment Reminders',
      description: 'Reminders for customer dues'
    },
    {
      key: 'dailySummary',
      icon: Bell,
      title: 'Daily Sales Summary',
      description: 'End of day sales report'
    },
    {
      key: 'whatsappNotifications',
      icon: MessageSquare,
      title: 'WhatsApp Notifications',
      description: 'Send alerts via WhatsApp'
    }
  ];

  return (
    <AppLayout title="Notifications" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>

        {/* Notification Options */}
        <div className="space-y-3">
          {notificationOptions.map((option) => (
            <div 
              key={option.key}
              className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <option.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{option.title}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [option.key]: !settings[option.key as keyof typeof settings] })}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  settings[option.key as keyof typeof settings] ? "bg-primary" : "bg-secondary"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all",
                  settings[option.key as keyof typeof settings] ? "left-6" : "left-1"
                )} />
              </button>
            </div>
          ))}
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
