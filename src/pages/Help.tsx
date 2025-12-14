import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronDown,
  HelpCircle, 
  MessageSquare, 
  FileText,
  Mic,
  Package,
  Receipt,
  Users
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I create a bill using voice?',
    answer: 'Open the AI Assistant by tapping the chat icon. Click the microphone button and speak your command like "Create bill for Ramesh - 2 blue kurtis size M at 500 rupees each". The AI will understand and help create the bill.'
  },
  {
    question: 'How do I add inventory items?',
    answer: 'Go to Inventory → Add Item or Upload BOM. You can upload a supplier bill (photo, PDF, or Excel) and our AI will automatically extract and add the items to your inventory.'
  },
  {
    question: 'How do I track customer dues?',
    answer: 'Go to Customers page to see all customers and their outstanding dues. Click on a customer to view details and send due reminders via WhatsApp.'
  },
  {
    question: 'What AI commands can I use?',
    answer: 'You can ask about stock ("Is blue kurti in stock?"), sales ("Aaj kitni sale hui?"), create bills, get business insights, and more. The AI understands both Hindi and English.'
  },
  {
    question: 'How do I generate GST invoices?',
    answer: 'When creating a bill, all GST calculations are automatic based on item rates. After saving, you can download the invoice in A4, thermal, or compact format.'
  },
  {
    question: 'How do I backup my data?',
    answer: 'Your data is automatically synced to the cloud. You can also manually export a backup from Settings → Backup & Restore.'
  }
];

const guides = [
  { icon: Mic, title: 'Voice Commands Guide', description: 'Learn all voice commands' },
  { icon: Package, title: 'Inventory Management', description: 'Add, update, track stock' },
  { icon: Receipt, title: 'Billing Tutorial', description: 'Create bills step by step' },
  { icon: Users, title: 'Customer Management', description: 'Manage customers & dues' }
];

export default function Help() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <AppLayout title="Help" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Help & FAQ</h1>
        </div>

        {/* Quick Guides */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Guides
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {guides.map((guide) => (
              <button
                key={guide.title}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all text-center"
              >
                <div className="p-3 rounded-xl bg-primary/10">
                  <guide.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{guide.title}</p>
                  <p className="text-xs text-muted-foreground">{guide.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="flex-1 font-medium text-foreground">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    openFAQ === index && "rotate-180"
                  )} />
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground pl-8">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Need more help?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Our support team is available 24/7 to help you.
          </p>
          <a
            href="https://wa.me/919876543210?text=Hi, I need help with Revonn app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-white font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
