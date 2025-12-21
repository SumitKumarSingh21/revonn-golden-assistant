import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Sparkles, Crown, Zap, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const plans = [
  {
    id: 'basic',
    name: 'Revonn Basic',
    nameHi: 'रेवॉन बेसिक',
    icon: Zap,
    monthlyPrice: 219,
    yearlyPrice: 2199,
    popular: false,
    features: [
      { name: 'Unlimited billing (Non-GST)', nameHi: 'असीमित बिलिंग (नॉन-जीएसटी)', included: true },
      { name: 'Unlimited inventory items', nameHi: 'असीमित इन्वेंट्री आइटम', included: true },
      { name: 'Unlimited customers', nameHi: 'असीमित ग्राहक', included: true },
      { name: 'Daily sales & expense tracking', nameHi: 'दैनिक बिक्री और खर्च ट्रैकिंग', included: true },
      { name: 'Basic reports & analytics', nameHi: 'बेसिक रिपोर्ट और एनालिटिक्स', included: true },
      { name: 'PDF invoices', nameHi: 'पीडीएफ इनवॉयस', included: true },
      { name: 'Manual WhatsApp sharing', nameHi: 'मैन्युअल व्हाट्सएप शेयरिंग', included: true },
      { name: 'GST invoices & compliance', nameHi: 'जीएसटी इनवॉयस और अनुपालन', included: false },
      { name: 'Staff management', nameHi: 'स्टाफ प्रबंधन', included: false },
      { name: 'Advanced analytics', nameHi: 'एडवांस्ड एनालिटिक्स', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Revonn Pro',
    nameHi: 'रेवॉन प्रो',
    icon: Crown,
    monthlyPrice: 349,
    yearlyPrice: 3499,
    popular: true,
    features: [
      { name: 'Everything in Basic', nameHi: 'बेसिक की सभी सुविधाएं', included: true },
      { name: 'GST invoices (CGST/SGST/IGST)', nameHi: 'जीएसटी इनवॉयस (CGST/SGST/IGST)', included: true },
      { name: 'HSN/SAC code support', nameHi: 'HSN/SAC कोड सपोर्ट', included: true },
      { name: 'Staff management & attendance', nameHi: 'स्टाफ प्रबंधन और उपस्थिति', included: true },
      { name: 'Role-based access control', nameHi: 'रोल-आधारित एक्सेस कंट्रोल', included: true },
      { name: 'Advanced reports & analytics', nameHi: 'एडवांस्ड रिपोर्ट और एनालिटिक्स', included: true },
      { name: 'Monthly/category-wise reports', nameHi: 'मासिक/श्रेणी-वार रिपोर्ट', included: true },
      { name: 'Multi-user login', nameHi: 'मल्टी-यूज़र लॉगिन', included: true },
      { name: 'Priority support', nameHi: 'प्राथमिकता सहायता', included: true },
    ]
  }
];

const aiAddon = {
  name: 'AI Add-on',
  nameHi: 'AI ऐड-ऑन',
  icon: Sparkles,
  price: 99,
  features: [
    { en: 'Voice & text billing commands', hi: 'वॉयस और टेक्स्ट बिलिंग कमांड' },
    { en: 'Smart inventory insights', hi: 'स्मार्ट इन्वेंट्री इनसाइट्स' },
    { en: 'Low-stock predictions', hi: 'कम स्टॉक भविष्यवाणी' },
    { en: 'Daily profit analysis', hi: 'दैनिक लाभ विश्लेषण' },
    { en: 'Hindi & English support', hi: 'हिंदी और अंग्रेजी सपोर्ट' },
    { en: 'Festival marketing content', hi: 'त्योहार मार्केटिंग कंटेंट' },
  ]
};

export default function SettingsPricing() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleCheckout = () => {
    if (!selectedPlan) {
      toast.error(language === 'hi' ? 'कृपया एक प्लान चुनें' : 'Please select a plan');
      return;
    }
    
    const plan = plans.find(p => p.id === selectedPlan);
    const price = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.yearlyPrice;
    const aiPrice = includeAI ? aiAddon.price : 0;
    const total = (price || 0) + aiPrice;
    
    navigate('/checkout', { 
      state: { 
        plan: selectedPlan, 
        billingCycle, 
        includeAI, 
        total,
        planName: language === 'hi' ? plan?.nameHi : plan?.name
      } 
    });
  };

  return (
    <AppLayout title={t('pricing')} hideNav>
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
            <h1 className="text-xl font-bold text-foreground">{t('pricing')}</h1>
            <p className="text-sm text-muted-foreground">{t('choose_plan')}</p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-2 p-1 bg-secondary rounded-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              billingCycle === 'yearly' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground'
            }`}
          >
            {t('yearly')}
            <Badge variant="secondary" className="text-xs bg-success/20 text-success">
              {t('save_15')}
            </Badge>
          </button>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`p-4 relative cursor-pointer transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                } ${plan.popular ? 'border-primary/50' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-4 bg-primary text-xs">
                    {t('most_popular')}
                  </Badge>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h2 className="font-bold">{language === 'hi' ? plan.nameHi : plan.name}</h2>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">₹{price}</span>
                        <span className="text-sm text-muted-foreground">
                          /{billingCycle === 'monthly' ? t('month') : t('year')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                        {language === 'hi' ? feature.nameHi : feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* AI Add-on */}
        <Card 
          onClick={() => setIncludeAI(!includeAI)}
          className={`p-4 cursor-pointer transition-all bg-gradient-to-r from-violet-500/10 to-purple-500/10 ${
            includeAI ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-violet-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <h3 className="font-bold">{language === 'hi' ? aiAddon.nameHi : aiAddon.name}</h3>
                <p className="text-sm text-muted-foreground">
                  +₹{aiAddon.price}/{t('month')}
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              includeAI ? 'border-violet-500 bg-violet-500' : 'border-muted-foreground'
            }`}>
              {includeAI && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2">
            {aiAddon.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-violet-500" />
                <span>{language === 'hi' ? feature.hi : feature.en}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fixed Checkout Button */}
        {selectedPlan && (
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              onClick={handleCheckout}
              className="w-full btn-gold flex items-center justify-center gap-2"
              size="lg"
            >
              <CreditCard className="w-5 h-5" />
              {t('proceed_to_checkout')} - ₹{
                (billingCycle === 'monthly' 
                  ? plans.find(p => p.id === selectedPlan)?.monthlyPrice 
                  : plans.find(p => p.id === selectedPlan)?.yearlyPrice) || 0
              + (includeAI ? aiAddon.price : 0)}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}