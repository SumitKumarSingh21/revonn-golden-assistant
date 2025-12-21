import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PolicyRefund() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <AppLayout title={t('refund_policy')} hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('refund_policy')}</h1>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2 className="text-lg font-semibold mb-4">Refund & Cancellation Policy</h2>
          
          <p className="mb-4">
            Revonn provides digital subscription-based services.
          </p>

          <ul className="space-y-3 list-disc pl-5">
            <li>Once a subscription is activated, refunds are generally not provided.</li>
            <li>Cancellation requests may be raised within 2 days of initial purchase, provided the service has not been substantially used.</li>
            <li>No refunds are issued for partially used subscription periods.</li>
            <li>Refunds, if approved, will be processed within 5–7 working days to the original payment method.</li>
          </ul>

          <p className="mt-6">
            For refund requests, contact: <a href="mailto:support@revonn.in" className="text-primary">support@revonn.in</a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}