import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubscriptionPlansProps {
  trigger?: string;
  onClose?: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Revonn Basic',
    nameHi: 'रेवॉन बेसिक',
    icon: Zap,
    monthlyPrice: 219,
    yearlyPrice: 2199,
    popular: false,
    highlights: [
      { en: 'Unlimited billing (Non-GST)', hi: 'असीमित बिलिंग (नॉन-जीएसटी)' },
      { en: 'Unlimited inventory items', hi: 'असीमित इन्वेंट्री आइटम' },
      { en: 'Unlimited customers', hi: 'असीमित ग्राहक' },
      { en: 'Daily sales & expense tracking', hi: 'दैनिक बिक्री और खर्च ट्रैकिंग' },
      { en: 'PDF invoices & sharing', hi: 'पीडीएफ इनवॉयस और शेयरिंग' },
      { en: 'Basic reports & analytics', hi: 'बेसिक रिपोर्ट और एनालिटिक्स' },
    ],
    notIncluded: [
      { en: 'GST invoices', hi: 'जीएसटी इनवॉयस' },
      { en: 'Staff management', hi: 'स्टाफ प्रबंधन' },
      { en: 'Multi-user access', hi: 'मल्टी-यूज़र एक्सेस' },
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
    highlights: [
      { en: 'Everything in Basic', hi: 'बेसिक की सभी सुविधाएं' },
      { en: 'GST invoices (CGST/SGST/IGST)', hi: 'जीएसटी इनवॉयस (CGST/SGST/IGST)' },
      { en: 'HSN/SAC code support', hi: 'HSN/SAC कोड सपोर्ट' },
      { en: 'Staff management & attendance', hi: 'स्टाफ प्रबंधन और उपस्थिति' },
      { en: 'Role-based access control', hi: 'रोल-आधारित एक्सेस कंट्रोल' },
      { en: 'Advanced reports & analytics', hi: 'एडवांस्ड रिपोर्ट और एनालिटिक्स' },
      { en: 'Multi-user login', hi: 'मल्टी-यूज़र लॉगिन' },
      { en: 'Priority support', hi: 'प्राथमिकता सहायता' },
    ],
    notIncluded: []
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
    { en: 'Marketing content generation', hi: 'मार्केटिंग कंटेंट जेनरेशन' },
    { en: 'Hindi & English support', hi: 'हिंदी और अंग्रेजी सपोर्ट' },
  ]
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ trigger, onClose }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  const triggerMessages: { [key: string]: { en: string; hi: string } } = {
    bills: { en: "You've reached the demo limit of 5 bills.", hi: "आपने 5 बिल की डेमो सीमा पूरी कर ली है।" },
    inventory: { en: "You've reached the demo limit of 10 inventory items.", hi: "आपने 10 इन्वेंट्री आइटम की डेमो सीमा पूरी कर ली है।" },
    customers: { en: "You've reached the demo limit of 10 customers.", hi: "आपने 10 ग्राहक की डेमो सीमा पूरी कर ली है।" },
    gst: { en: "GST features require a Pro subscription.", hi: "जीएसटी फीचर्स के लिए प्रो सब्सक्रिप्शन चाहिए।" },
    staff: { en: "Staff management requires a Pro subscription.", hi: "स्टाफ प्रबंधन के लिए प्रो सब्सक्रिप्शन चाहिए।" },
    reports: { en: "Advanced reports require a paid subscription.", hi: "एडवांस्ड रिपोर्ट के लिए पेड सब्सक्रिप्शन चाहिए।" },
  };

  const handleSubscribe = (planId: string) => {
    navigate('/settings/pricing');
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === 'hi' ? 'अपना प्लान चुनें' : 'Choose Your Plan'}
            </h1>
            {trigger && triggerMessages[trigger] && (
              <p className="text-muted-foreground text-sm mt-1">
                {language === 'hi' ? triggerMessages[trigger].hi : triggerMessages[trigger].en}
              </p>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {language === 'hi' ? 'मासिक' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {language === 'hi' ? 'वार्षिक' : 'Yearly'}
            <Badge variant="secondary" className="ml-2 text-xs bg-success/20 text-success">
              {language === 'hi' ? '15% बचाएं' : 'Save 15%'}
            </Badge>
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            
            return (
              <Card 
                key={plan.id}
                className={`p-6 relative ${
                  plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {language === 'hi' ? 'सबसे लोकप्रिय' : 'Most Popular'}
                  </Badge>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h2 className="text-xl font-bold">{language === 'hi' ? plan.nameHi : plan.name}</h2>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">₹{price}</span>
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? (language === 'hi' ? 'महीना' : 'month') : (language === 'hi' ? 'वर्ष' : 'year')}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.highlights.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">
                        {language === 'hi' ? feature.hi : feature.en}
                      </span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <li key={`not-${idx}`} className="flex items-start gap-2">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">
                        {language === 'hi' ? feature.hi : feature.en}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {language === 'hi' ? `${plan.nameHi} चुनें` : `Subscribe to ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* AI Add-on */}
        <Card className="p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{language === 'hi' ? aiAddon.nameHi : aiAddon.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi' ? 'किसी भी प्लान में AI जोड़ें' : 'Add AI intelligence to any plan'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">+₹{aiAddon.price}</span>
              <span className="text-muted-foreground">/{language === 'hi' ? 'महीना' : 'month'}</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {aiAddon.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span>{language === 'hi' ? feature.hi : feature.en}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Demo Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {language === 'hi' 
              ? 'डेमो मोड में शामिल: 5 बिल, 10 इन्वेंट्री आइटम, 10 ग्राहक' 
              : 'Demo mode includes: 5 bills, 10 inventory items, 10 customers'}
          </p>
          <p>
            {language === 'hi' 
              ? 'सब्सक्रिप्शन के बाद सभी डेमो डेटा सुरक्षित रहेगा।' 
              : 'All demo data will be preserved after subscription.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
