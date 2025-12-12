import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Plus,
  Minus,
  Search,
  User,
  Percent,
  IndianRupee,
  Trash2,
  Share2,
  FileText
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import { useAppStore } from '@/store/app-store';
import type { InventoryItem, Customer, Invoice, InvoiceItem, TaxBreakup } from '@/types';
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

interface BillItem extends InvoiceItem {
  inventoryItem?: InventoryItem;
}

export default function Billing() {
  const navigate = useNavigate();
  const { shopSettings } = useAppStore();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [inv, cust] = await Promise.all([
      db.inventory.getAll(),
      db.customers.getAll()
    ]);
    setInventory(inv);
    setCustomers(cust);
  };

  const addItem = (item: InventoryItem, variantIndex: number = 0) => {
    const variant = item.variants[variantIndex];
    const existingIndex = billItems.findIndex(
      bi => bi.itemId === item.id && bi.variantId === variant.id
    );

    if (existingIndex >= 0) {
      updateQuantity(existingIndex, billItems[existingIndex].quantity + 1);
    } else {
      const newItem: BillItem = {
        id: uuidv4(),
        itemId: item.id,
        itemName: item.name,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        quantity: 1,
        unitPrice: item.sellingPrice,
        taxRate: item.taxRate,
        total: item.sellingPrice,
        inventoryItem: item
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

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percent' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const afterDiscount = subtotal - discountAmount;
  
  // Calculate tax breakup (assuming same state = CGST+SGST)
  const taxBreakup: TaxBreakup = billItems.reduce((acc, item) => {
    const taxableAmount = (item.total / (1 + item.taxRate / 100));
    const taxAmount = item.total - taxableAmount;
    // Assuming same state for now
    acc.cgst += taxAmount / 2;
    acc.sgst += taxAmount / 2;
    return acc;
  }, { cgst: 0, sgst: 0, igst: 0 });

  const totalTax = taxBreakup.cgst + taxBreakup.sgst + taxBreakup.igst;
  const grandTotal = afterDiscount;

  const generatePDF = (invoice: Invoice): Blob => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(shopSettings.shopName, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(shopSettings.address, 105, 28, { align: 'center' });
    doc.text(`GSTIN: ${shopSettings.gstin}`, 105, 34, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(14);
    doc.text('TAX INVOICE', 105, 48, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 60);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 150, 60);
    
    if (invoice.customerName) {
      doc.text(`Customer: ${invoice.customerName}`, 20, 68);
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, 20, 74);
      }
    }
    
    // Items table header
    let y = 85;
    doc.setFillColor(200, 200, 200);
    doc.rect(20, y, 170, 8, 'F');
    doc.text('Item', 22, y + 6);
    doc.text('Qty', 100, y + 6);
    doc.text('Rate', 120, y + 6);
    doc.text('Amount', 155, y + 6);
    
    // Items
    y += 12;
    invoice.items.forEach((item) => {
      doc.text(item.itemName.substring(0, 40), 22, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(formatCurrency(item.unitPrice), 120, y);
      doc.text(formatCurrency(item.total), 155, y);
      y += 8;
    });
    
    // Totals
    y += 5;
    doc.line(20, y, 190, y);
    y += 8;
    doc.text(`Subtotal:`, 120, y);
    doc.text(formatCurrency(invoice.subtotal), 155, y);
    
    if (invoice.discountAmount > 0) {
      y += 6;
      doc.text(`Discount:`, 120, y);
      doc.text(`-${formatCurrency(invoice.discountAmount)}`, 155, y);
    }
    
    y += 6;
    doc.text(`CGST:`, 120, y);
    doc.text(formatCurrency(invoice.taxBreakup.cgst), 155, y);
    y += 6;
    doc.text(`SGST:`, 120, y);
    doc.text(formatCurrency(invoice.taxBreakup.sgst), 155, y);
    
    y += 8;
    doc.setFontSize(12);
    doc.text(`Grand Total:`, 120, y);
    doc.text(formatCurrency(invoice.grandTotal), 155, y);
    
    // Footer
    doc.setFontSize(9);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    return doc.output('blob');
  };

  const handleSave = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSaving(true);

    try {
      // Generate invoice number
      const allInvoices = await db.invoices.getAll();
      const invoiceNumber = `${shopSettings.invoicePrefix}-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(allInvoices.length + 1).toString().padStart(4, '0')}`;

      const invoice: Invoice = {
        id: uuidv4(),
        invoiceNumber,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        items: billItems.map(({ inventoryItem, ...item }) => item),
        subtotal,
        discountAmount,
        discountType,
        discountValue,
        taxBreakup,
        totalTax,
        grandTotal,
        paymentMethod: 'cash',
        paidAmount: grandTotal,
        status: 'paid',
        createdAt: new Date(),
        syncStatus: 'pending'
      };

      // Save invoice
      await db.invoices.add(invoice);

      // Update inventory stock
      for (const item of billItems) {
        if (item.inventoryItem) {
          const updatedItem = { ...item.inventoryItem };
          const variantIndex = updatedItem.variants.findIndex(v => v.id === item.variantId);
          if (variantIndex >= 0) {
            updatedItem.variants[variantIndex].stock -= item.quantity;
          }
          updatedItem.updatedAt = new Date();
          await db.inventory.update(updatedItem);
        }
      }

      // Generate PDF
      const pdfBlob = generatePDF(invoice);
      
      // Share if auto-WhatsApp is enabled
      if (shopSettings.autoWhatsApp && selectedCustomer?.phone) {
        try {
          await navigator.share({
            title: `Invoice ${invoiceNumber}`,
            text: `Invoice from ${shopSettings.shopName}\nTotal: ${formatCurrency(grandTotal)}`,
            files: [new File([pdfBlob], `${invoiceNumber}.pdf`, { type: 'application/pdf' })]
          });
        } catch (shareError) {
          // Share cancelled or not supported
        }
      }

      toast.success(`Invoice ${invoiceNumber} created!`);
      navigate('/');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error creating invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="New Bill" hideNav>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
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
          {/* Customer Selection */}
          <button
            onClick={() => setShowCustomerSearch(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="p-2 rounded-lg bg-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              {selectedCustomer ? (
                <>
                  <p className="font-medium text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Select Customer (Walk-in)</p>
              )}
            </div>
          </button>

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
                      {item.size && `Size: ${item.size} • `}
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
                  className="w-20 px-2 py-1 rounded-lg border border-input text-right"
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
                <span className="text-muted-foreground">CGST + SGST</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={billItems.length === 0 || isSaving}
            className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : `Save & Share Invoice`}
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
                        {item.sku && `${item.sku} • `}
                        Stock: {item.variants.reduce((s, v) => s + v.stock, 0)}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(item.sellingPrice)}</p>
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
                  onClick={() => setShowCustomerSearch(false)}
                  className="p-2 rounded-xl bg-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">Select Customer</h2>
              </div>
              
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerSearch(false);
                }}
                className="w-full flex items-center gap-3 p-3 bg-secondary rounded-xl mb-2"
              >
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Walk-in Customer</span>
              </button>
              
              <div className="space-y-2">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerSearch(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{customer.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
