import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, Eye, Database, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SettingsPrivacy() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const privacyItems = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'All your data is encrypted in transit and at rest',
      status: 'Enabled'
    },
    {
      icon: Eye,
      title: 'Data Access',
      description: 'Only you can access your business data',
      status: 'Private'
    },
    {
      icon: Database,
      title: 'Data Storage',
      description: 'Data stored securely on cloud servers',
      status: 'India Region'
    }
  ];

  return (
    <AppLayout title="Privacy & Security" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Privacy & Security</h1>
        </div>

        {/* Security Status */}
        <div className="p-5 rounded-2xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/20">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-success">Your account is secure</h2>
              <p className="text-sm text-muted-foreground">All security measures are enabled</p>
            </div>
          </div>
        </div>

        {/* Privacy Items */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Data Protection
          </h3>
          <div className="space-y-2">
            {privacyItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-secondary">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground">Sign out from this device</p>
              </div>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="pt-4">
          <button
            onClick={() => toast.info('Please contact support to delete your account')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            This will permanently delete all your data
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
