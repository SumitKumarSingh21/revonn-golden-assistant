import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CreditCard, Smartphone, Building2, Shield, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PaymentMethod = 'upi' | 'card' | 'netbanking';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const { refreshSubscription } = useSubscription();
  
  const { plan, billingCycle, includeAI, total, planName } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) {
    navigate('/settings/pricing');
    return null;
  }

  const handlePayment = async () => {
    if (paymentMethod === 'upi' && !upiId) {
      toast.error(language === 'hi' ? 'कृपया UPI ID दर्ज करें' : 'Please enter UPI ID');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const expiresAt = new Date();
        if (billingCycle === 'monthly') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        await supabase
          .from('user_subscriptions')
          .update({
            plan_type: plan,
            ai_addon: includeAI,
            billing_cycle: billingCycle,
            is_active: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        await refreshSubscription();
      }

      toast.success(
        language === 'hi' 
          ? 'भुगतान सफल! आपका प्लान सक्रिय हो गया है।' 
          : 'Payment successful! Your plan is now active.'
      );
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        language === 'hi' 
          ? 'भुगतान विफल। कृपया पुनः प्रयास करें।' 
          : 'Payment failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout title={t('checkout')} hideNav>
      <div className="px-4 py-4 pb-32 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('checkout')}</h1>
            <p className="text-sm text-muted-foreground">{t('complete_purchase')}</p>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">{t('order_summary')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{planName}</span>
              <span className="font-medium">₹{total - (includeAI ? 99 : 0)}</span>
            </div>
            {includeAI && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Add-on</span>
                <span className="font-medium">₹99</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('billing_cycle')}</span>
              <span className="font-medium capitalize">{billingCycle}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold">{t('total')}</span>
              <span className="font-bold text-primary">₹{total}</span>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <div>
          <h2 className="font-semibold mb-4">{t('payment_method')}</h2>
          <div className="space-y-3">
            <Card 
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'upi' ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">UPI</p>
                  <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'upi' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {paymentMethod === 'upi' && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
              
              {paymentMethod === 'upi' && (
                <div className="mt-4">
                  <Label htmlFor="upi">{t('enter_upi_id')}</Label>
                  <Input
                    id="upi"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </Card>

            <Card 
              onClick={() => setPaymentMethod('card')}
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t('credit_debit_card')}</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'card' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {paymentMethod === 'card' && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            </Card>

            <Card 
              onClick={() => setPaymentMethod('netbanking')}
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'netbanking' ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t('net_banking')}</p>
                  <p className="text-xs text-muted-foreground">{t('all_major_banks')}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'netbanking' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {paymentMethod === 'netbanking' && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
          <Shield className="w-5 h-5 text-success" />
          <p className="text-sm text-muted-foreground">
            {language === 'hi' 
              ? 'आपका भुगतान 256-bit SSL से सुरक्षित है'
              : 'Your payment is secured with 256-bit SSL encryption'
            }
          </p>
        </div>

        {/* Pay Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full btn-gold"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('processing')}
              </div>
            ) : (
              `${t('pay_now')} ₹${total}`
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}