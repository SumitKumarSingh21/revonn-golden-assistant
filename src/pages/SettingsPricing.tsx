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
    sections: [
      {
        title: { en: '🧾 Billing (Non-GST)', hi: '🧾 बिलिंग (नॉन-जीएसटी)' },
        features: [
          { en: 'Unlimited bill creation', hi: 'असीमित बिल बनाएं', included: true },
          { en: 'Item billing with size & color', hi: 'साइज और रंग के साथ आइटम बिलिंग', included: true },
          { en: 'Discounts', hi: 'छूट', included: true },
          { en: 'Bill history', hi: 'बिल इतिहास', included: true },
          { en: 'PDF invoices', hi: 'पीडीएफ इनवॉयस', included: true },
          { en: 'Manual WhatsApp sharing', hi: 'मैन्युअल व्हाट्सएप शेयरिंग', included: true },
        ]
      },
      {
        title: { en: '📦 Inventory', hi: '📦 इन्वेंट्री' },
        features: [
          { en: 'Unlimited items', hi: 'असीमित आइटम', included: true },
          { en: 'Auto stock deduction', hi: 'ऑटो स्टॉक कटौती', included: true },
          { en: 'Purchase entries (BOM)', hi: 'खरीद एंट्री (BOM)', included: true },
          { en: 'Vendor list', hi: 'वेंडर लिस्ट', included: true },
          { en: 'Stock adjustments', hi: 'स्टॉक एडजस्टमेंट', included: true },
          { en: 'Sold-out visibility', hi: 'सोल्ड-आउट दृश्यता', included: true },
        ]
      },
      {
        title: { en: '👥 Customers', hi: '👥 ग्राहक' },
        features: [
          { en: 'Unlimited customers', hi: 'असीमित ग्राहक', included: true },
          { en: 'Purchase history', hi: 'खरीद इतिहास', included: true },
          { en: 'Manual outstanding tracking', hi: 'मैन्युअल बकाया ट्रैकिंग', included: true },
        ]
      },
      {
        title: { en: '💰 Finance', hi: '💰 वित्त' },
        features: [
          { en: 'Daily sales', hi: 'दैनिक बिक्री', included: true },
          { en: 'Expense tracking', hi: 'खर्च ट्रैकिंग', included: true },
          { en: 'Cash-in / cash-out', hi: 'कैश-इन / कैश-आउट', included: true },
          { en: 'Day-end summary', hi: 'दिन-अंत सारांश', included: true },
          { en: 'Basic profit view', hi: 'बेसिक लाभ दृश्य', included: true },
        ]
      },
      {
        title: { en: '📊 Reports', hi: '📊 रिपोर्ट' },
        features: [
          { en: 'Daily reports', hi: 'दैनिक रिपोर्ट', included: true },
          { en: 'Item-wise sales', hi: 'आइटम-वार बिक्री', included: true },
          { en: 'Basic analytics', hi: 'बेसिक एनालिटिक्स', included: true },
        ]
      },
      {
        title: { en: '🚫 Not Included', hi: '🚫 शामिल नहीं' },
        features: [
          { en: 'GST invoices', hi: 'जीएसटी इनवॉयस', included: false },
          { en: 'Staff management', hi: 'स्टाफ प्रबंधन', included: false },
          { en: 'Multi-user access', hi: 'मल्टी-यूज़र एक्सेस', included: false },
          { en: 'Advanced analytics', hi: 'एडवांस्ड एनालिटिक्स', included: false },
        ]
      }
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
    sections: [
      {
        title: { en: '✅ Everything in Basic, plus:', hi: '✅ बेसिक में सब कुछ, प्लस:' },
        features: []
      },
      {
        title: { en: '🧮 GST & Compliance', hi: '🧮 जीएसटी और अनुपालन' },
        features: [
          { en: 'GST invoices', hi: 'जीएसटी इनवॉयस', included: true },
          { en: 'CGST/SGST/IGST', hi: 'CGST/SGST/IGST', included: true },
          { en: 'HSN/SAC support', hi: 'HSN/SAC सपोर्ट', included: true },
          { en: 'GST summary reports', hi: 'जीएसटी सारांश रिपोर्ट', included: true },
          { en: 'Export for CA', hi: 'CA के लिए एक्सपोर्ट', included: true },
        ]
      },
      {
        title: { en: '👨‍💼 Staff Management', hi: '👨‍💼 स्टाफ प्रबंधन' },
        features: [
          { en: 'Add staff', hi: 'स्टाफ जोड़ें', included: true },
          { en: 'Attendance', hi: 'उपस्थिति', included: true },
          { en: 'Salary calculation', hi: 'वेतन गणना', included: true },
          { en: 'Role-based access', hi: 'रोल-आधारित एक्सेस', included: true },
          { en: 'Staff activity tracking', hi: 'स्टाफ गतिविधि ट्रैकिंग', included: true },
        ]
      },
      {
        title: { en: '📊 Advanced Reports', hi: '📊 एडवांस्ड रिपोर्ट' },
        features: [
          { en: 'Monthly sales', hi: 'मासिक बिक्री', included: true },
          { en: 'Category-wise reports', hi: 'श्रेणी-वार रिपोर्ट', included: true },
          { en: 'Best/low-performing items', hi: 'सर्वश्रेष्ठ/कम प्रदर्शन वाले आइटम', included: true },
          { en: 'Business analytics dashboard', hi: 'बिज़नेस एनालिटिक्स डैशबोर्ड', included: true },
        ]
      },
      {
        title: { en: '👥 Multi-user', hi: '👥 मल्टी-यूज़र' },
        features: [
          { en: 'Owner + staff login', hi: 'मालिक + स्टाफ लॉगिन', included: true },
          { en: 'Permission control', hi: 'परमिशन कंट्रोल', included: true },
        ]
      }
    ]
  }
];

const aiAddon = {
  name: 'AI Add-on',
  nameHi: 'AI ऐड-ऑन',
  icon: Sparkles,
  price: 99,
  sections: [
    {
      title: { en: '🧾 Billing', hi: '🧾 बिलिंग' },
      features: [
        { en: 'Create bills using text or voice', hi: 'टेक्स्ट या वॉयस से बिल बनाएं' },
        { en: 'Auto-fill items, quantity, size, color', hi: 'आइटम, मात्रा, साइज, रंग ऑटो-फिल' },
        { en: 'Auto-fill customer details', hi: 'ग्राहक विवरण ऑटो-फिल' },
      ]
    },
    {
      title: { en: '📦 Inventory', hi: '📦 इन्वेंट्री' },
      features: [
        { en: 'Low-stock prediction', hi: 'कम स्टॉक भविष्यवाणी' },
        { en: 'Fast-moving items insights', hi: 'तेज़ बिकने वाले आइटम इनसाइट्स' },
        { en: 'Slow/dead stock insights', hi: 'धीमे/डेड स्टॉक इनसाइट्स' },
        { en: 'Reorder suggestions', hi: 'रीऑर्डर सुझाव' },
      ]
    },
    {
      title: { en: '💰 Finance', hi: '💰 वित्त' },
      features: [
        { en: 'Daily profit insights', hi: 'दैनिक लाभ इनसाइट्स' },
        { en: 'Expense pattern analysis', hi: 'खर्च पैटर्न विश्लेषण' },
        { en: 'Sales explanations', hi: 'बिक्री व्याख्या' },
      ]
    },
    {
      title: { en: '📊 Reports & Insights', hi: '📊 रिपोर्ट और इनसाइट्स' },
      features: [
        { en: 'Daily insights', hi: 'दैनिक इनसाइट्स' },
        { en: 'Weekly summaries', hi: 'साप्ताहिक सारांश' },
        { en: 'Trend explanations', hi: 'ट्रेंड व्याख्या' },
      ]
    },
    {
      title: { en: '🧮 GST', hi: '🧮 जीएसटी' },
      features: [
        { en: 'GST rate suggestions', hi: 'जीएसटी दर सुझाव' },
        { en: 'Basic GST mistake detection', hi: 'बेसिक जीएसटी गलती पहचान' },
      ]
    },
    {
      title: { en: '💬 Marketing', hi: '💬 मार्केटिंग' },
      features: [
        { en: 'Generate offer messages', hi: 'ऑफर मैसेज जेनरेट करें' },
        { en: 'Festival promotions', hi: 'त्योहार प्रमोशन' },
        { en: 'Business-friendly copy', hi: 'बिज़नेस-फ्रेंडली कॉपी' },
      ]
    },
    {
      title: { en: '🗣️ AI Assistant', hi: '🗣️ AI सहायक' },
      features: [
        { en: 'Answer business questions', hi: 'बिज़नेस सवालों का जवाब' },
        { en: 'Use real business data', hi: 'असली बिज़नेस डेटा उपयोग' },
        { en: 'Hindi & English support', hi: 'हिंदी और अंग्रेजी सपोर्ट' },
      ]
    }
  ]
};

export default function SettingsPricing() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

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
            const isExpanded = expandedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`p-4 relative transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                } ${plan.popular ? 'border-primary/50' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-4 bg-primary text-xs">
                    {t('most_popular')}
                  </Badge>
                )}
                
                <div 
                  onClick={() => handleSelectPlan(plan.id)}
                  className="cursor-pointer"
                >
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
                </div>

                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="text-xs text-primary font-medium mb-3"
                >
                  {isExpanded 
                    ? (language === 'hi' ? 'कम दिखाएं' : 'Show Less') 
                    : (language === 'hi' ? 'सभी फीचर्स देखें' : 'View All Features')}
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-border pt-4">
                    {plan.sections.map((section, idx) => (
                      <div key={idx}>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          {language === 'hi' ? section.title.hi : section.title.en}
                        </h4>
                        <ul className="space-y-1.5">
                          {section.features.map((feature, fidx) => (
                            <li key={fidx} className="flex items-center gap-2 text-xs">
                              {feature.included ? (
                                <Check className="h-3.5 w-3.5 text-success shrink-0" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                              <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                                {language === 'hi' ? feature.hi : feature.en}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* AI Add-on */}
        <Card 
          className={`p-4 transition-all bg-gradient-to-r from-violet-500/10 to-purple-500/10 ${
            includeAI ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-violet-500/30'
          }`}
        >
          <div 
            onClick={() => setIncludeAI(!includeAI)}
            className="flex items-center justify-between cursor-pointer"
          >
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
          
          <div className="mt-4 space-y-3">
            {aiAddon.sections.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-xs font-semibold text-violet-600 mb-1">
                  {language === 'hi' ? section.title.hi : section.title.en}
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {section.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-violet-500 shrink-0" />
                      <span>{language === 'hi' ? feature.hi : feature.en}</span>
                    </div>
                  ))}
                </div>
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
