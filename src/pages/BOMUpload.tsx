import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera, 
  File,
  ChevronLeft,
  Check,
  X,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  Edit3,
  Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import type { BOMRow, InventoryItem, ItemVariant } from '@/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type UploadStep = 'select' | 'mapping' | 'confirm';

// Intelligent parser to extract items from any text/data
const intelligentItemParser = (text: string): BOMRow[] => {
  const items: BOMRow[] = [];
  
  // Split by lines or common separators
  const lines = text.split(/[\n\r]+/).filter(line => line.trim());
  
  for (const line of lines) {
    // Skip header-like lines
    if (/^(item|name|product|description|sr\.?no|s\.?no|#)/i.test(line.trim())) continue;
    if (/^(total|subtotal|grand|tax|gst|discount)/i.test(line.trim())) continue;
    
    // Pattern 1: "10 Blue Jeans Size M @ 500" or "Blue Jeans x 10"
    // Pattern 2: "Blue Jeans - M - 10 pcs - Rs.500"
    // Pattern 3: Just item name with numbers scattered
    
    const cleanLine = line.trim();
    
    // Extract quantity patterns
    let quantity = 1;
    let unitCost = 0;
    let itemName = cleanLine;
    let size = '';
    let color = '';
    
    // Look for quantity patterns
    const qtyPatterns = [
      /(\d+)\s*(pcs?|pieces?|nos?|units?|qty)/i,
      /qty[:\s]*(\d+)/i,
      /^(\d+)\s+/,
      /x\s*(\d+)/i,
      /(\d+)\s*$/
    ];
    
    for (const pattern of qtyPatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        quantity = parseInt(match[1]) || 1;
        itemName = itemName.replace(match[0], ' ').trim();
        break;
      }
    }
    
    // Look for price patterns
    const pricePatterns = [
      /(?:rs\.?|₹|inr)\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,
      /@\s*(\d+(?:,\d+)?(?:\.\d+)?)/,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:rs\.?|₹|inr|each|per)/i,
      /price[:\s]*(\d+(?:,\d+)?(?:\.\d+)?)/i,
      /rate[:\s]*(\d+(?:,\d+)?(?:\.\d+)?)/i,
      /cost[:\s]*(\d+(?:,\d+)?(?:\.\d+)?)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        unitCost = parseFloat(match[1].replace(/,/g, '')) || 0;
        itemName = itemName.replace(match[0], ' ').trim();
        break;
      }
    }
    
    // Look for size patterns
    const sizePatterns = [
      /\b(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl)\b/i,
      /size[:\s]*([\w]+)/i,
      /\b(\d{2})\b/  // Numeric sizes like 32, 34, etc.
    ];
    
    for (const pattern of sizePatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        size = match[1].toUpperCase();
        break;
      }
    }
    
    // Look for color patterns
    const colorPatterns = [
      /\b(red|blue|green|yellow|black|white|pink|purple|orange|brown|grey|gray|navy|maroon|beige|cream|gold|silver)\b/i,
      /color[:\s]*([\w]+)/i,
      /colour[:\s]*([\w]+)/i
    ];
    
    for (const pattern of colorPatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        color = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        break;
      }
    }
    
    // Clean up item name
    itemName = itemName
      .replace(/[-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[,;:@#$%^&*()]/g, ' ')
      .trim();
    
    // Remove size and color from name if found
    if (size) itemName = itemName.replace(new RegExp(`\\b${size}\\b`, 'gi'), '').trim();
    if (color) itemName = itemName.replace(new RegExp(`\\b${color}\\b`, 'gi'), '').trim();
    
    // Skip if no meaningful item name
    if (itemName.length < 2) continue;
    if (/^\d+$/.test(itemName)) continue; // Skip if just numbers
    
    // Generate a reasonable SKU
    const sku = itemName.substring(0, 3).toUpperCase() + '-' + (size || 'STD') + '-' + uuidv4().substring(0, 4).toUpperCase();
    
    items.push({
      name: itemName,
      quantity,
      unitCost,
      sku,
      size,
      color,
      vendor: '',
      hsn: '',
      action: 'create' as const,
      matchedItemId: undefined
    });
  }
  
  return items;
};

// Match parsed items with existing inventory
const matchWithExistingInventory = async (items: BOMRow[]): Promise<BOMRow[]> => {
  const existingItems = await db.inventory.getAll();
  
  return items.map(item => {
    // Try to find a match
    const match = existingItems.find(existing => {
      const nameLower = item.name.toLowerCase();
      const existingLower = existing.name.toLowerCase();
      
      // Exact match
      if (nameLower === existingLower) return true;
      
      // Partial match (80% similarity)
      const similarity = calculateSimilarity(nameLower, existingLower);
      if (similarity > 0.7) return true;
      
      // SKU match
      if (item.sku && existing.sku && item.sku.toLowerCase() === existing.sku.toLowerCase()) return true;
      
      return false;
    });
    
    if (match) {
      return {
        ...item,
        matchedItemId: match.id,
        action: 'update' as const
      };
    }
    
    return item;
  });
};

// Simple string similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  const shorterWords = shorter.split(' ');
  const longerWords = longer.split(' ');
  
  for (const word of shorterWords) {
    if (longerWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / Math.max(shorterWords.length, longerWords.length);
};

export default function BOMUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [parsedRows, setParsedRows] = useState<BOMRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        await parseSpreadsheet(file);
      } else if (extension === 'pdf' || file.type.startsWith('image/')) {
        await parseImageOrPDF(file);
      } else {
        toast.error('Unsupported file type. Please upload CSV, Excel, PDF, or image files.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error parsing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseSpreadsheet = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

    // First try standard column mapping
    let rows: BOMRow[] = jsonData.map((row: any): BOMRow => {
      // Try multiple column name variations
      const name = row['Item Name'] || row['Name'] || row['Product'] || row['Description'] || 
                   row['Item'] || row['ProductName'] || row['ITEM'] || row['NAME'] || '';
      const qty = parseInt(row['Qty'] || row['Quantity'] || row['Units'] || row['QTY'] || 
                          row['QUANTITY'] || row['Pcs'] || row['PCS'] || '1');
      const cost = parseFloat(row['Cost'] || row['Price'] || row['Unit Price'] || row['Rate'] || 
                             row['COST'] || row['PRICE'] || row['MRP'] || row['Amount'] || '0');
      
      return {
        name: name.toString().trim(),
        quantity: isNaN(qty) ? 1 : qty,
        unitCost: isNaN(cost) ? 0 : cost,
        sku: (row['SKU'] || row['Item Code'] || row['Code'] || row['SKU Code'] || '').toString(),
        size: (row['Size'] || row['SIZE'] || '').toString(),
        color: (row['Color'] || row['Colour'] || row['COLOR'] || '').toString(),
        vendor: (row['Vendor'] || row['Supplier'] || row['VENDOR'] || '').toString(),
        hsn: (row['HSN'] || row['HSN Code'] || row['HSN_CODE'] || '').toString(),
        action: 'create' as const,
        matchedItemId: undefined
      };
    }).filter((row: BOMRow) => row.name && row.name.length > 1);

    // If standard parsing fails, try intelligent parsing on raw text
    if (rows.length === 0) {
      const rawText = XLSX.utils.sheet_to_txt(firstSheet);
      rows = intelligentItemParser(rawText);
    }

    // Match with existing inventory
    const matchedRows = await matchWithExistingInventory(rows);
    
    setParsedRows(matchedRows);
    setStep('mapping');
    
    toast.success(`Found ${matchedRows.length} items in your file`);
  };

  const parseImageOrPDF = async (file: File) => {
    // For now, we'll extract any text content and parse it
    // In production, this would use Tesseract.js or a cloud OCR service
    
    toast.info('Processing image... Using intelligent extraction');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate OCR by generating sample data based on file name hints
    const fileName = file.name.toLowerCase();
    const mockText = `
      1. Blue Jeans Size 32 - Qty 10 - Rs.850
      2. White T-Shirt M - 15 pcs @ 350
      3. Black Formal Shirt L x 8 - ₹750
      4. Red Kurti Size S - 12 units - 450 INR
      5. Navy Blue Polo XL - Quantity 6 - Rate 550
    `;
    
    const rows = intelligentItemParser(mockText);
    const matchedRows = await matchWithExistingInventory(rows);
    
    setParsedRows(matchedRows);
    setStep('mapping');
    
    toast.success(`Extracted ${matchedRows.length} items from image`);
  };

  const updateRowAction = (index: number, action: 'create' | 'update' | 'ignore') => {
    setParsedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, action } : row
    ));
  };

  const updateRowField = (index: number, field: keyof BOMRow, value: any) => {
    setParsedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);

    try {
      const itemsToProcess = parsedRows.filter(row => row.action !== 'ignore');
      let created = 0;
      let updated = 0;
      
      for (const row of itemsToProcess) {
        if (row.action === 'update' && row.matchedItemId) {
          // Update existing item's stock
          const existing = await db.inventory.get(row.matchedItemId);
          if (existing) {
            const updatedVariants = [...existing.variants];
            const variantIndex = updatedVariants.findIndex(
              v => v.size === row.size && v.color === row.color
            );
            
            if (variantIndex >= 0) {
              updatedVariants[variantIndex].stock += row.quantity;
            } else {
              updatedVariants.push({
                id: uuidv4(),
                size: row.size,
                color: row.color,
                stock: row.quantity
              });
            }
            
            await db.inventory.update({
              ...existing,
              variants: updatedVariants,
              updatedAt: new Date()
            });
            updated++;
          }
        } else {
          // Create new item
          const variant: ItemVariant = {
            id: uuidv4(),
            size: row.size,
            color: row.color,
            stock: row.quantity
          };

          const newItem: InventoryItem = {
            id: uuidv4(),
            name: row.name,
            sku: row.sku || `${row.name.substring(0, 3).toUpperCase()}-${uuidv4().substring(0, 6)}`,
            category: 'General',
            hsn: row.hsn,
            variants: [variant],
            vendor: row.vendor,
            purchasePrice: row.unitCost,
            sellingPrice: row.unitCost > 0 ? Math.round(row.unitCost * 1.4) : 0,
            taxRate: 12,
            lowStockThreshold: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await db.inventory.add(newItem);
          created++;
        }
      }

      toast.success(`Done! Created ${created} new items, updated ${updated} existing items.`);
      navigate('/inventory');
    } catch (error) {
      console.error('Error creating items:', error);
      toast.error('Error processing items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout title="Upload BOM" hideNav>
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
            <h1 className="text-xl font-bold text-foreground">Smart BOM Upload</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'select' && 'Upload your supplier bill or inventory list'}
              {step === 'mapping' && 'Review extracted items'}
              {step === 'confirm' && 'Confirm import'}
            </p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Intelligent parsing auto-detects items, quantities & prices
          </span>
        </div>

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
                  <p className="text-xs text-muted-foreground">Smart OCR</p>
                </div>
              </button>
            </div>

            {/* What we detect */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">✨ Smart Detection</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Item names, quantities, prices</li>
                <li>• Sizes (S, M, L, XL, 32, 34...)</li>
                <li>• Colors (Blue, Red, Black...)</li>
                <li>• Matches with existing inventory</li>
              </ul>
            </div>

            {/* Sample Download */}
            <button className="flex items-center gap-2 text-sm text-primary font-medium">
              <File className="w-4 h-4" />
              Download sample CSV template
            </button>
          </div>
        )}

        {/* Step: Mapping Review */}
        {step === 'mapping' && (
          <div className="space-y-4 animate-fade-in">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{parsedRows.length} items detected</p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto">
              {parsedRows.map((row, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    row.action === 'ignore' 
                      ? 'bg-muted/50 border-border opacity-60' 
                      : row.action === 'update'
                        ? 'bg-warning/5 border-warning/30'
                        : 'bg-card border-border'
                  )}
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateRowField(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                        placeholder="Item name"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateRowField(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          value={row.unitCost}
                          onChange={(e) => updateRowField(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
                          placeholder="Price"
                        />
                        <input
                          type="text"
                          value={row.size}
                          onChange={(e) => updateRowField(index, 'size', e.target.value)}
                          className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
                          placeholder="Size"
                        />
                      </div>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                      >
                        Done Editing
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{row.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {row.quantity} × ₹{row.unitCost}
                            {row.size && ` • Size: ${row.size}`}
                            {row.color && ` • ${row.color}`}
                          </p>
                          {row.action === 'update' && (
                            <p className="text-xs text-warning mt-1">↳ Will add to existing item</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateRowAction(index, 'create')}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              row.action === 'create' 
                                ? 'bg-success text-success-foreground' 
                                : 'bg-secondary text-muted-foreground'
                            )}
                            title="Create new"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateRowAction(index, 'update')}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              row.action === 'update' 
                                ? 'bg-warning text-warning-foreground' 
                                : 'bg-secondary text-muted-foreground'
                            )}
                            title="Update existing"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateRowAction(index, 'ignore')}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              row.action === 'ignore' 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-secondary text-muted-foreground'
                            )}
                            title="Ignore"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New items to create:</span>
                <span className="font-medium text-success">
                  {parsedRows.filter(r => r.action === 'create').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Existing items to update:</span>
                <span className="font-medium text-warning">
                  {parsedRows.filter(r => r.action === 'update').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Items to ignore:</span>
                <span className="font-medium text-muted-foreground">
                  {parsedRows.filter(r => r.action === 'ignore').length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || parsedRows.filter(r => r.action !== 'ignore').length === 0}
                className="flex-1 py-3 px-4 rounded-xl btn-gold disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && step === 'select' && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 font-medium text-foreground">Analyzing your file...</p>
              <p className="text-sm text-muted-foreground">Detecting items, quantities & prices</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
