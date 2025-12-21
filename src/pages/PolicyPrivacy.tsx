import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PolicyPrivacy() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <AppLayout title={t('privacy_policy')} hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('privacy_policy')}</h1>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="mb-4">
            Revonn respects your privacy and is committed to protecting your personal data.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">1. Information We Collect</h2>
          <p>We may collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, phone number, email</li>
            <li>Business details</li>
            <li>Login and usage data</li>
            <li>Payment confirmation details (we do not store card or UPI credentials)</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-3">2. Use of Information</h2>
          <p>Your information is used to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and improve services</li>
            <li>Manage subscriptions</li>
            <li>Communicate updates and support</li>
            <li>Prevent fraud and misuse</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-3">3. Sharing of Data</h2>
          <p>We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payment gateways</li>
            <li>Technology and service partners</li>
            <li>Legal or regulatory authorities when required</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-3">4. Data Security</h2>
          <p>
            We use reasonable security practices to protect your information. However, internet transmission is not fully secure.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">5. Data Retention</h2>
          <p>
            Data is retained only as long as required for business or legal purposes.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">6. User Rights</h2>
          <p>
            You may access, update, or request deletion of your account by contacting us.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">7. Grievance Officer</h2>
          <div className="bg-secondary/50 p-4 rounded-lg mt-2">
            <p><strong>Name:</strong> Navneet Raj</p>
            <p><strong>Designation:</strong> Founder & CEO</p>
            <p><strong>Business:</strong> Revonn</p>
            <p><strong>Email:</strong> <a href="mailto:support@revonn.in" className="text-primary">support@revonn.in</a></p>
            <p><strong>Location:</strong> Ranchi, Jharkhand, India</p>
            <p><strong>Response Time:</strong> Within 48 hours</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}