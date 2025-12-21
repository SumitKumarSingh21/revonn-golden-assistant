import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PolicyTerms() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <AppLayout title={t('terms_conditions')} hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('terms_conditions')}</h1>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-sm text-muted-foreground">Last Updated: 21/12/2025</p>
          
          <p className="text-sm text-muted-foreground mt-4">
            This document is an electronic record under the Information Technology Act, 2000.
          </p>
          
          <p className="mt-4">
            Revonn ("we", "us", "our") is a Udyam Registered MSME in India, providing subscription-based Software-as-a-Service (SaaS) solutions through its website and mobile applications (collectively, the "Platform").
          </p>
          
          <p className="mt-2">
            By accessing or using the Platform, you ("User") agree to these Terms.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">1. Services</h2>
          <p>
            Revonn provides digital business management software, including billing, invoicing, inventory, reports, CRM, and related features. Revonn does not sell physical goods and does not provide shipping or delivery services.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">2. User Account</h2>
          <p>
            You agree to provide accurate information during registration and are responsible for all activities under your account.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">3. Subscription & Payments</h2>
          <p>
            Access to services is provided on a paid subscription basis. Fees are displayed on the Platform and are payable in advance. Prices may change with prior notice.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">4. Use of Platform</h2>
          <p>
            You agree not to use the Platform for any unlawful, fraudulent, or prohibited purpose.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">5. Intellectual Property</h2>
          <p>
            All content, software, logos, and designs belong to Revonn. No rights are granted except for permitted use of the services.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">6. Disclaimer</h2>
          <p>
            Services are provided on an "as-is" basis. Revonn does not guarantee uninterrupted or error-free operation.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">7. Limitation of Liability</h2>
          <p>
            Revonn shall not be liable for indirect, incidental, or consequential damages arising from use of the Platform.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Courts at Ranchi, Jharkhand shall have exclusive jurisdiction.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-3">9. Contact</h2>
          <p>
            For queries, contact us at: <a href="mailto:support@revonn.in" className="text-primary">support@revonn.in</a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}