import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Header
  'ai_business_os': { en: 'AI Business OS', hi: 'AI बिज़नेस OS' },
  
  // Dashboard
  'good_morning': { en: 'Good Morning!', hi: 'सुप्रभात!' },
  'good_afternoon': { en: 'Good Afternoon!', hi: 'नमस्कार!' },
  'good_evening': { en: 'Good Evening!', hi: 'शुभ संध्या!' },
  'quick_access': { en: 'Quick Access', hi: 'त्वरित पहुँच' },
  'todays_summary': { en: "Today's Summary", hi: 'आज का सारांश' },
  'total_sales': { en: 'Total Sales', hi: 'कुल बिक्री' },
  'items_sold': { en: 'Items Sold', hi: 'बेचे गए आइटम' },
  'invoices': { en: 'invoices', hi: 'बिल' },
  'cash_in': { en: 'Cash In', hi: 'नकद प्राप्त' },
  'tax_collected': { en: 'Tax Collected', hi: 'कर एकत्रित' },
  'todays_revenue': { en: "Today's Revenue", hi: 'आज का राजस्व' },
  'top_selling_items': { en: 'Top Selling Items', hi: 'सबसे ज़्यादा बिकने वाले' },
  'sold': { en: 'sold', hi: 'बिके' },
  'low_stock_alerts': { en: 'Low Stock Alerts', hi: 'कम स्टॉक अलर्ट' },
  'view_all': { en: 'View All', hi: 'सभी देखें' },
  'only_left': { en: 'Only', hi: 'सिर्फ' },
  'left': { en: 'left', hi: 'बचे' },
  'restock': { en: 'Restock', hi: 'रीस्टॉक' },
  'recent_bills': { en: 'Recent Bills', hi: 'हाल के बिल' },
  'no_bills_today': { en: 'No bills today yet', hi: 'आज कोई बिल नहीं' },
  'create_first_bill': { en: 'Create your first bill', hi: 'पहला बिल बनाएं' },
  'walk_in_customer': { en: 'Walk-in Customer', hi: 'वॉक-इन ग्राहक' },
  'items': { en: 'items', hi: 'आइटम' },
  
  // Navigation tabs
  'bill': { en: 'Bill', hi: 'बिल' },
  'inventory': { en: 'Inventory', hi: 'इन्वेंट्री' },
  'finance': { en: 'Finance', hi: 'वित्त' },
  'customer': { en: 'Customer', hi: 'ग्राहक' },
  'gst': { en: 'GST', hi: 'जीएसटी' },
  'marketing': { en: 'Marketing', hi: 'मार्केटिंग' },
  'staff': { en: 'Staff', hi: 'कर्मचारी' },
  'soon': { en: 'Soon', hi: 'जल्द' },
  
  // Bottom Nav
  'home': { en: 'Home', hi: 'होम' },
  'reports': { en: 'Reports', hi: 'रिपोर्ट' },
  'settings': { en: 'Settings', hi: 'सेटिंग्स' },
  
  // Inventory
  'search_items': { en: 'Search items...', hi: 'आइटम खोजें...' },
  'add_item': { en: 'Add Item', hi: 'आइटम जोड़ें' },
  'upload_bom': { en: 'Upload BOM', hi: 'BOM अपलोड करें' },
  'all': { en: 'All', hi: 'सभी' },
  'top_selling': { en: 'Top Selling', hi: 'टॉप सेलिंग' },
  'low_stock': { en: 'Low Stock', hi: 'कम स्टॉक' },
  'no_items_found': { en: 'No items found', hi: 'कोई आइटम नहीं मिला' },
  'loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'stock': { en: 'Stock', hi: 'स्टॉक' },
  'price': { en: 'Price', hi: 'कीमत' },
  'save': { en: 'Save', hi: 'सेव करें' },
  'cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'update': { en: 'Update', hi: 'अपडेट करें' },
  'delete': { en: 'Delete', hi: 'हटाएं' },
  
  // Billing
  'create_bill': { en: 'Create Bill', hi: 'बिल बनाएं' },
  'customer_details': { en: 'Customer Details', hi: 'ग्राहक विवरण' },
  'search_existing': { en: 'Search existing', hi: 'मौजूदा खोजें' },
  'customer_name': { en: 'Customer name', hi: 'ग्राहक का नाम' },
  'phone_number': { en: 'Phone number', hi: 'फ़ोन नंबर' },
  'add_items': { en: 'Add Items', hi: 'आइटम जोड़ें' },
  'no_items_added': { en: 'No items added yet', hi: 'अभी कोई आइटम नहीं' },
  'subtotal': { en: 'Subtotal', hi: 'उप-कुल' },
  'discount': { en: 'Discount', hi: 'छूट' },
  'tax': { en: 'Tax', hi: 'कर' },
  'total': { en: 'Total', hi: 'कुल' },
  'payment_mode': { en: 'Payment Mode', hi: 'भुगतान का तरीका' },
  'cash': { en: 'Cash', hi: 'नकद' },
  'card': { en: 'Card', hi: 'कार्ड' },
  'online': { en: 'Online', hi: 'ऑनलाइन' },
  'due': { en: 'Due', hi: 'बकाया' },
  'amount_received': { en: 'Amount Received', hi: 'प्राप्त राशि' },
  'balance': { en: 'Balance', hi: 'शेष' },
  'save_print': { en: 'Save & Print', hi: 'सेव और प्रिंट' },
  
  // Reports
  'today': { en: 'Today', hi: 'आज' },
  'days_7': { en: '7 Days', hi: '7 दिन' },
  'days_30': { en: '30 Days', hi: '30 दिन' },
  'gross_profit': { en: 'Gross Profit', hi: 'सकल लाभ' },
  'export_report': { en: 'Export Report as PDF', hi: 'PDF के रूप में निर्यात करें' },
  'recent_invoices': { en: 'Recent Invoices', hi: 'हाल के बिल' },
  'no_invoices_period': { en: 'No invoices in this period', hi: 'इस अवधि में कोई बिल नहीं' },
  
  // Customers
  'customers': { en: 'Customers', hi: 'ग्राहक' },
  'add_customer': { en: 'Add Customer', hi: 'ग्राहक जोड़ें' },
  'search_customers': { en: 'Search customers...', hi: 'ग्राहक खोजें...' },
  'total_purchases': { en: 'Total Purchases', hi: 'कुल खरीदारी' },
  'total_dues': { en: 'Total Dues', hi: 'कुल बकाया' },
  
  // Settings
  'shop_settings': { en: 'Shop Settings', hi: 'दुकान सेटिंग्स' },
  'ai_settings': { en: 'AI Settings', hi: 'AI सेटिंग्स' },
  'invoice_settings': { en: 'Invoice Settings', hi: 'बिल सेटिंग्स' },
  'notifications': { en: 'Notifications', hi: 'सूचनाएं' },
  'backup_restore': { en: 'Backup & Restore', hi: 'बैकअप और रिस्टोर' },
  'privacy': { en: 'Privacy', hi: 'गोपनीयता' },
  'help': { en: 'Help', hi: 'सहायता' },
  
  // Common
  'loading_inventory': { en: 'Loading inventory...', hi: 'इन्वेंट्री लोड हो रही है...' },
  'error': { en: 'Error', hi: 'त्रुटि' },
  'success': { en: 'Success', hi: 'सफल' },
  'confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'back': { en: 'Back', hi: 'वापस' },
  
  // Product Detail
  'product_details': { en: 'Product Details', hi: 'उत्पाद विवरण' },
  'edit_product': { en: 'Edit Product', hi: 'उत्पाद संपादित करें' },
  'sku': { en: 'SKU', hi: 'SKU' },
  'category': { en: 'Category', hi: 'श्रेणी' },
  'size': { en: 'Size', hi: 'साइज़' },
  'color': { en: 'Color', hi: 'रंग' },
  'cost_price': { en: 'Cost Price', hi: 'लागत मूल्य' },
  'selling_price': { en: 'Selling Price', hi: 'बिक्री मूल्य' },
  'gst_rate': { en: 'GST Rate', hi: 'जीएसटी दर' },
  'quantity': { en: 'Quantity', hi: 'मात्रा' },
  'sales_count': { en: 'Sales Count', hi: 'बिक्री गणना' },
  'hsn_code': { en: 'HSN Code', hi: 'HSN कोड' },
  'last_sold': { en: 'Last Sold', hi: 'अंतिम बिक्री' },
  'never': { en: 'Never', hi: 'कभी नहीं' },
  'product_updated': { en: 'Product updated successfully', hi: 'उत्पाद सफलतापूर्वक अपडेट हुआ' },
  'update_error': { en: 'Error updating product', hi: 'उत्पाद अपडेट करने में त्रुटि' },
  
  // Subscription
  'demo_limit_reached': { en: 'Demo Limit Reached', hi: 'डेमो सीमा पूरी' },
  'view_plans': { en: 'View Plans', hi: 'प्लान देखें' },
  'continue_demo': { en: 'Continue Demo', hi: 'डेमो जारी रखें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('revonn-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('revonn-language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
