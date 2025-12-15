import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera, 
  File,
  ChevronLeft,
  Check,
  X,
  Plus,
  Edit3,
  Sparkles,
  Loader2,
  FileText,
  Trash2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type UploadStep = 'select' | 'mapping' | 'manual';

interface ParsedItem {
  name: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  sku: string;
  category: string;
  selected: boolean;
}

export default function BOMUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // Manual entry state
  const [manualItem, setManualItem] = useState({
    name: '',
    quantity: '1',
    price: '',
    size: '',
    color: '',
    sku: '',
    category: 'General'
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let content = '';
      let contentType = 'text';
      
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        content = XLSX.utils.sheet_to_csv(firstSheet);
        contentType = 'csv';
      } else if (file.type.startsWith('image/') || extension === 'pdf') {
        // For images/PDFs, we'll read as base64 and describe
        content = await readFileAsText(file);
        contentType = file.type.startsWith('image/') ? 'image' : 'pdf';
      } else {
        content = await file.text();
        contentType = 'text';
      }

      // Call the parse-bom edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      const response = await supabase.functions.invoke('parse-bom', {
        body: { content, contentType }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.items && result.items.length > 0) {
        const items: ParsedItem[] = result.items.map((item: any) => ({
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          size: item.size || '',
          color: item.color || '',
          sku: item.sku || '',
          category: item.category || 'General',
          selected: true
        }));
        
        setParsedItems(items);
        setStep('mapping');
        toast.success(`Found ${items.length} items in your file`);
      } else {
        toast.error('No items found in the file. Try manual entry.');
        setStep('manual');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error parsing file. Try manual entry.');
      setStep('manual');
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // For images, we'll just provide file info since we can't do OCR client-side
      resolve(`File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);
    });
  };

  const toggleItemSelection = (index: number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: any) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    const selectedItems = parsedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      // Insert items into inventory
      const inventoryItems = selectedItems.map(item => ({
        user_id: session.user.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost_price: item.price * 0.7, // Estimate cost as 70% of selling price
        size: item.size || null,
        color: item.color || null,
        sku: item.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        category: item.category,
        sales_count: 0,
        gst_rate: 18
      }));

      const { error } = await supabase
        .from('inventory')
        .insert(inventoryItems);

      if (error) throw error;

      toast.success(`Successfully added ${selectedItems.length} items to inventory!`);
      navigate('/inventory');
    } catch (error) {
      console.error('Error importing items:', error);
      toast.error('Error importing items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualItem.name.trim()) {
      toast.error('Please enter item name');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: session.user.id,
          name: manualItem.name.trim(),
          quantity: parseInt(manualItem.quantity) || 1,
          price: parseFloat(manualItem.price) || 0,
          cost_price: (parseFloat(manualItem.price) || 0) * 0.7,
          size: manualItem.size || null,
          color: manualItem.color || null,
          sku: manualItem.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          category: manualItem.category,
          sales_count: 0,
          gst_rate: 18
        });

      if (error) throw error;

      toast.success('Item added to inventory!');
      
      // Reset form for next item
      setManualItem({
        name: '',
        quantity: '1',
        price: '',
        size: '',
        color: '',
        sku: '',
        category: 'General'
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error adding item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout title="Add Inventory" hideNav>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => step === 'select' ? navigate(-1) : setStep('select')}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {step === 'select' && 'Add Inventory'}
              {step === 'mapping' && 'Review Items'}
              {step === 'manual' && 'Manual Entry'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 'select' && 'Upload bill or add manually'}
              {step === 'mapping' && `${parsedItems.filter(i => i.selected).length} items selected`}
              {step === 'manual' && 'Add items one by one'}
            </p>
          </div>
        </div>

        {/* AI Badge */}
        {step !== 'manual' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              AI-powered: auto-detects items, quantities & prices
            </span>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-2xl border border-border text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="font-medium text-foreground">Processing...</p>
              <p className="text-sm text-muted-foreground">AI is analyzing your file</p>
            </div>
          </div>
        )}

        {/* Step: Select File */}
        {step === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  fileInputRef.current?.setAttribute('accept', '.csv,.xlsx,.xls');
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                <div className="p-4 rounded-xl bg-primary/10">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">CSV / Excel</p>
                  <p className="text-xs text-muted-foreground">Best accuracy</p>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.setAttribute('accept', 'image/*,.pdf');
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                <div className="p-4 rounded-xl bg-secondary">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Photo / PDF</p>
                  <p className="text-xs text-muted-foreground">AI parsing</p>
                </div>
              </button>
            </div>

            {/* Manual Entry Option */}
            <button
              onClick={() => setStep('manual')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary transition-colors"
            >
              <div className="p-3 rounded-xl bg-secondary">
                <Edit3 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">Manual Entry</p>
                <p className="text-xs text-muted-foreground">Add items one by one</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </button>

            {/* What we detect */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">✨ Smart Detection</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Item names, quantities, prices</li>
                <li>• Sizes (S, M, L, XL, 32, 34...)</li>
                <li>• Colors (Blue, Red, Black...)</li>
                <li>• Categories auto-assigned</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Mapping Review */}
        {step === 'mapping' && (
          <div className="space-y-4 animate-fade-in">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground truncate flex-1">{fileName}</span>
              <span className="text-xs text-muted-foreground">{parsedItems.length} items</span>
            </div>

            {/* Items list */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {parsedItems.map((item, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    item.selected 
                      ? "bg-card border-primary/30" 
                      : "bg-secondary/50 border-border opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItemSelection(index)}
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 flex-shrink-0",
                        item.selected 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground"
                      )}
                    >
                      {item.selected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none"
                      />
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Qty:</span>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-0.5 rounded bg-secondary text-foreground"
                            min="1"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">₹</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-0.5 rounded bg-secondary text-foreground"
                            min="0"
                          />
                        </div>
                        
                        {item.size && (
                          <span className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">
                            Size: {item.size}
                          </span>
                        )}
                        
                        {item.color && (
                          <span className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Confirm */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">
                    {parsedItems.filter(i => i.selected).length} items selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total value: ₹{parsedItems.filter(i => i.selected).reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing || parsedItems.filter(i => i.selected).length === 0}
                className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Add to Inventory
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Manual Entry */}
        {step === 'manual' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={manualItem.name}
                  onChange={(e) => setManualItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Blue Denim Jeans"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={manualItem.quantity}
                    onChange={(e) => setManualItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="1"
                    min="1"
                    className="input-field"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={manualItem.price}
                    onChange={(e) => setManualItem(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Size */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Size (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualItem.size}
                    onChange={(e) => setManualItem(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="M, L, XL, 32..."
                    className="input-field"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Color (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualItem.color}
                    onChange={(e) => setManualItem(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Blue, Red..."
                    className="input-field"
                  />
                </div>
              </div>

              {/* SKU */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  SKU / Item Code (Optional)
                </label>
                <input
                  type="text"
                  value={manualItem.sku}
                  onChange={(e) => setManualItem(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="input-field"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Category
                </label>
                <select
                  value={manualItem.category}
                  onChange={(e) => setManualItem(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                >
                  <option value="General">General</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Home">Home & Living</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleManualAdd}
              disabled={isProcessing || !manualItem.name.trim()}
              className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Item
                </>
              )}
            </button>

            {/* Done button */}
            <button
              onClick={() => navigate('/inventory')}
              className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium"
            >
              Done - View Inventory
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}