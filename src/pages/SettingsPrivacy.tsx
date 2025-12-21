import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, Eye, Database, Trash2, FileText, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SettingsPrivacy() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(language === 'hi' ? 'सफलतापूर्वक साइन आउट हुआ' : 'Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error(language === 'hi' ? 'साइन आउट करने में विफल' : 'Failed to sign out');
    }
  };

  const privacyItems = [
    {
      icon: Lock,
      title: language === 'hi' ? 'डेटा एन्क्रिप्शन' : 'Data Encryption',
      description: language === 'hi' ? 'आपका सभी डेटा ट्रांजिट और रेस्ट में एन्क्रिप्टेड है' : 'All your data is encrypted in transit and at rest',
      status: language === 'hi' ? 'सक्षम' : 'Enabled'
    },
    {
      icon: Eye,
      title: language === 'hi' ? 'डेटा एक्सेस' : 'Data Access',
      description: language === 'hi' ? 'केवल आप अपने व्यावसायिक डेटा तक पहुंच सकते हैं' : 'Only you can access your business data',
      status: language === 'hi' ? 'निजी' : 'Private'
    },
    {
      icon: Database,
      title: language === 'hi' ? 'डेटा स्टोरेज' : 'Data Storage',
      description: language === 'hi' ? 'क्लाउड सर्वर पर सुरक्षित रूप से संग्रहीत' : 'Data stored securely on cloud servers',
      status: language === 'hi' ? 'भारत क्षेत्र' : 'India Region'
    }
  ];

  const policyLinks = [
    {
      title: language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions',
      path: '/policies/terms'
    },
    {
      title: language === 'hi' ? 'रिफंड और रद्दीकरण नीति' : 'Refund & Cancellation Policy',
      path: '/policies/refund'
    },
    {
      title: language === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy',
      path: '/policies/privacy'
    }
  ];

  return (
    <AppLayout title={t('privacy_security')} hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('privacy_security')}</h1>
        </div>

        {/* Security Status */}
        <div className="p-5 rounded-2xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/20">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-success">
                {language === 'hi' ? 'आपका खाता सुरक्षित है' : 'Your account is secure'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'hi' ? 'सभी सुरक्षा उपाय सक्षम हैं' : 'All security measures are enabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Items */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === 'hi' ? 'डेटा सुरक्षा' : 'Data Protection'}
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

        {/* Policy Links */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === 'hi' ? 'हमारी नीतियां' : 'Our Policies'}
          </h3>
          <div className="space-y-2">
            {policyLinks.map((policy) => (
              <Link
                key={policy.path}
                to={policy.path}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{policy.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === 'hi' ? 'खाता' : 'Account'}
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
                <p className="font-medium text-foreground">
                  {language === 'hi' ? 'साइन आउट' : 'Sign Out'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' ? 'इस डिवाइस से साइन आउट करें' : 'Sign out from this device'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="pt-4">
          <button
            onClick={() => toast.info(language === 'hi' ? 'कृपया अपना खाता हटाने के लिए सपोर्ट से संपर्क करें' : 'Please contact support to delete your account')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'hi' ? 'खाता हटाएं' : 'Delete Account'}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {language === 'hi' ? 'यह आपके सभी डेटा को स्थायी रूप से हटा देगा' : 'This will permanently delete all your data'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
