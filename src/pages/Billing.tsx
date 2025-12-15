import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Plus,
  Minus,
  Search,
  User,
  Percent,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Download,
  Share2,
  Check
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface BillItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  size?: string;
  color?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  gst_rate: number;
  size?: string;
  color?: string;
}

type PaymentMode = 'cash' | 'card' | 'online' | 'due';

const paymentModes: { value: PaymentMode; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'online', label: 'Online', icon: Smartphone },
  { value: 'due', label: 'Due', icon: Clock }
];

const invoiceTemplates = [
  { id: 'a4', label: 'A4 Standard' },
  { id: 'thermal', label: 'Thermal 80mm' },
  { id: 'compact', label: 'Compact A5' }
];

export default function Billing() {
  const navigate = useNavigate();
  const { shopSettings } = useAppStore();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('a4');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const [invRes, custRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('user_id', session.user.id),
        supabase.from('customers').select('id, name, phone').eq('user_id', session.user.id)
      ]);

      if (invRes.data) setInventory(invRes.data);
      if (custRes.data) setCustomers(custRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addItem = (item: InventoryItem) => {
    const existingIndex = billItems.findIndex(bi => bi.itemId === item.id);

    if (existingIndex >= 0) {
      updateQuantity(existingIndex, billItems[existingIndex].quantity + 1);
    } else {
      const newItem: BillItem = {
        id: uuidv4(),
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: Number(item.price),
        taxRate: Number(item.gst_rate) || 18,
        total: Number(item.price),
        size: item.size,
        color: item.color
      };
      setBillItems([...billItems, newItem]);
    }
    setShowItemSearch(false);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    setBillItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity: newQty, total: item.unitPrice * newQty }
        : item
    ));
  };

  const removeItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowCustomerSearch(false);
  };

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percent' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const afterDiscount = subtotal - discountAmount;
  
  // Calculate tax
  const taxAmount = billItems.reduce((acc, item) => {
    const taxableAmount = (item.total / (1 + item.taxRate / 100));
    return acc + (item.total - taxableAmount);
  }, 0);

  const grandTotal = afterDiscount;
  const dueAmount = paymentMode === 'due' ? grandTotal : Math.max(0, grandTotal - amountPaid);

  // Update amount paid when payment mode changes
  useEffect(() => {
    if (paymentMode !== 'due') {
      setAmountPaid(grandTotal);
    } else {
      setAmountPaid(0);
    }
  }, [paymentMode, grandTotal]);

  const generatePDF = (invoiceNumber: string): Blob => {
    const doc = new jsPDF(selectedTemplate === 'thermal' ? { unit: 'mm', format: [80, 200] } : undefined);
    const isA4 = selectedTemplate === 'a4';
    const isThermal = selectedTemplate === 'thermal';
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Header
    doc.setFontSize(isThermal ? 12 : 20);
    doc.setFont('helvetica', 'bold');
    doc.text(shopSettings.shopName || 'Revonn Store', centerX, isThermal ? 10 : 25, { align: 'center' });
    
    doc.setFontSize(isThermal ? 8 : 10);
    doc.setFont('helvetica', 'normal');
    if (shopSettings.address) {
      doc.text(shopSettings.address, centerX, isThermal ? 14 : 32, { align: 'center' });
    }
    if (shopSettings.gstin) {
      doc.text(`GSTIN: ${shopSettings.gstin}`, centerX, isThermal ? 18 : 38, { align: 'center' });
    }
    
    // Invoice title
    doc.setFontSize(isThermal ? 10 : 14);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', centerX, isThermal ? 24 : 50, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(isThermal ? 7 : 10);
    doc.setFont('helvetica', 'normal');
    let y = isThermal ? 30 : 60;
    doc.text(`Invoice: ${invoiceNumber}`, isThermal ? 5 : 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, isThermal ? 45 : 140, y);
    
    if (customerName) {
      y += isThermal ? 4 : 6;
      doc.text(`Customer: ${customerName}`, isThermal ? 5 : 20, y);
      if (customerPhone) {
        doc.text(`Phone: ${customerPhone}`, isThermal ? 45 : 140, y);
      }
    }
    
    // Items header
    y += isThermal ? 6 : 12;
    doc.setFillColor(200, 200, 200);
    doc.rect(isThermal ? 3 : 20, y, isThermal ? 74 : 170, isThermal ? 5 : 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', isThermal ? 5 : 22, y + (isThermal ? 3.5 : 6));
    doc.text('Qty', isThermal ? 45 : 120, y + (isThermal ? 3.5 : 6));
    doc.text('Amt', isThermal ? 60 : 165, y + (isThermal ? 3.5 : 6));
    
    // Items
    y += isThermal ? 6 : 12;
    doc.setFont('helvetica', 'normal');
    billItems.forEach((item) => {
      const itemName = item.itemName.length > (isThermal ? 18 : 40) 
        ? item.itemName.substring(0, isThermal ? 18 : 40) + '...'
        : item.itemName;
      doc.text(itemName, isThermal ? 5 : 22, y);
      doc.text(item.quantity.toString(), isThermal ? 47 : 122, y);
      doc.text(formatCurrency(item.total).replace('₹', ''), isThermal ? 55 : 155, y);
      y += isThermal ? 4 : 7;
    });
    
    // Line
    y += 2;
    doc.line(isThermal ? 3 : 20, y, isThermal ? 77 : 190, y);
    
    // Totals
    y += isThermal ? 4 : 8;
    const totalsX = isThermal ? 30 : 120;
    const amountX = isThermal ? 55 : 165;
    
    doc.text('Subtotal:', totalsX, y);
    doc.text(formatCurrency(subtotal).replace('₹', ''), amountX, y);
    
    if (discountAmount > 0) {
      y += isThermal ? 4 : 6;
      doc.text('Discount:', totalsX, y);
      doc.text(`-${formatCurrency(discountAmount).replace('₹', '')}`, amountX, y);
    }
    
    y += isThermal ? 4 : 6;
    doc.text('Tax:', totalsX, y);
    doc.text(formatCurrency(taxAmount).replace('₹', ''), amountX, y);
    
    y += isThermal ? 5 : 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isThermal ? 9 : 12);
    doc.text('TOTAL:', totalsX, y);
    doc.text(formatCurrency(grandTotal), amountX - 5, y);
    
    // Payment info
    y += isThermal ? 5 : 10;
    doc.setFontSize(isThermal ? 7 : 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${paymentMode.toUpperCase()}`, isThermal ? 5 : 20, y);
    if (dueAmount > 0) {
      doc.text(`Due: ${formatCurrency(dueAmount)}`, isThermal ? 45 : 140, y);
    }
    
    // Footer
    y = isThermal ? 180 : 270;
    doc.setFontSize(isThermal ? 7 : 9);
    doc.text('Thank you for your business!', centerX, y, { align: 'center' });
    
    y += isThermal ? 4 : 6;
    doc.setFontSize(isThermal ? 6 : 8);
    doc.setTextColor(150);
    doc.text('Powered by Revonn', centerX, y, { align: 'center' });
    
    return doc.output('blob');
  };

  const handleSave = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to create bills');
        navigate('/auth');
        return;
      }

      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      
      const invoiceNumber = `${shopSettings.invoicePrefix || 'INV'}-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${((count || 0) + 1).toString().padStart(4, '0')}`;

      // Create or update customer
      let customerId = selectedCustomerId;
      if (!customerId && customerName) {
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert({
            user_id: session.user.id,
            name: customerName,
            phone: customerPhone || null,
            total_purchases: grandTotal,
            total_dues: dueAmount
          })
          .select()
          .single();
        
        if (custError) throw custError;
        customerId = newCustomer.id;
      } else if (customerId) {
        // Update existing customer
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('total_purchases, total_dues')
          .eq('id', customerId)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({
              total_purchases: Number(existingCustomer.total_purchases) + grandTotal,
              total_dues: Number(existingCustomer.total_dues) + dueAmount
            })
            .eq('id', customerId);
        }
      }

      // Create invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          user_id: session.user.id,
          customer_id: customerId,
          invoice_number: invoiceNumber,
          customer_name: customerName || 'Walk-in Customer',
          customer_phone: customerPhone || null,
          items: billItems as unknown as import('@/integrations/supabase/types').Json,
          subtotal,
          tax_amount: taxAmount,
          discount: discountAmount,
          total: grandTotal,
          payment_mode: paymentMode,
          amount_paid: amountPaid,
          due_amount: dueAmount,
          status: dueAmount > 0 ? 'partial' : 'completed'
        }]);

      if (invoiceError) throw invoiceError;

      // Update inventory quantities
      for (const item of billItems) {
        const { data: currentItem } = await supabase
          .from('inventory')
          .select('quantity, sales_count')
          .eq('id', item.itemId)
          .single();
        
        if (currentItem) {
          await supabase
            .from('inventory')
            .update({ 
              quantity: Math.max(0, currentItem.quantity - item.quantity),
              sales_count: (currentItem.sales_count || 0) + item.quantity,
              last_sold_at: new Date().toISOString()
            })
            .eq('id', item.itemId);
        }
      }

      // Generate PDF
      const pdfBlob = generatePDF(invoiceNumber);
      
      // Offer to share
      if (navigator.share && customerPhone) {
        try {
          await navigator.share({
            title: `Invoice ${invoiceNumber}`,
            text: `Invoice from ${shopSettings.shopName}\nTotal: ${formatCurrency(grandTotal)}`,
            files: [new File([pdfBlob], `${invoiceNumber}.pdf`, { type: 'application/pdf' })]
          });
        } catch {
          // Download instead
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${invoiceNumber}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Just download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`Invoice ${invoiceNumber} created!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error creating invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <AppLayout title="New Bill" hideNav>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border bg-card">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Create Bill</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Customer Info */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4" />
                Customer Details
              </div>
              <button
                onClick={() => setShowCustomerSearch(true)}
                className="text-xs text-primary font-medium"
              >
                Search existing
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="input-field text-sm"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone number"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Add Items */}
          <button
            onClick={() => setShowItemSearch(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>

          {/* Bill Items */}
          {billItems.length > 0 && (
            <div className="space-y-2">
              {billItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size && `${item.size} • `}
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1.5 rounded-lg bg-secondary"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1.5 rounded-lg bg-secondary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="font-semibold text-foreground w-20 text-right">
                    {formatCurrency(item.total)}
                  </p>
                  
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Discount */}
          {billItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Discount</span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded-lg border border-input text-right text-sm"
                  min="0"
                />
                <button
                  onClick={() => setDiscountType(discountType === 'percent' ? 'flat' : 'percent')}
                  className="px-3 py-1 rounded-lg bg-secondary text-sm font-medium"
                >
                  {discountType === 'percent' ? '%' : '₹'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Mode */}
          {billItems.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Payment Mode</p>
              <div className="grid grid-cols-4 gap-2">
                {paymentModes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMode(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                      paymentMode === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
              
              {paymentMode !== 'due' && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-sm text-muted-foreground">Amount Paid:</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg border border-input text-right"
                    max={grandTotal}
                  />
                </div>
              )}
            </div>
          )}

          {/* Invoice Template */}
          {billItems.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Invoice Format</p>
              <div className="grid grid-cols-3 gap-2">
                {invoiceTemplates.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedTemplate(id)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all",
                      selectedTemplate === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {selectedTemplate === id && <Check className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="border-t border-border bg-card p-4 space-y-3">
          {billItems.length > 0 && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between text-warning">
                  <span>Due Amount</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={billItems.length === 0 || isSaving}
            className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Save & Download Invoice
              </>
            )}
          </button>
        </div>

        {/* Item Search Modal */}
        {showItemSearch && (
          <div className="fixed inset-0 z-50 bg-background/95 animate-fade-in">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => {
                    setShowItemSearch(false);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-xl bg-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {item.quantity} • GST: {item.gst_rate}%
                      </p>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(Number(item.price))}</p>
                  </button>
                ))}
                
                {filteredItems.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No items found
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div className="fixed inset-0 z-50 bg-background/95 animate-fade-in">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => {
                    setShowCustomerSearch(false);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-xl bg-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
                    </div>
                  </button>
                ))}
                
                {filteredCustomers.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No customers found
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
