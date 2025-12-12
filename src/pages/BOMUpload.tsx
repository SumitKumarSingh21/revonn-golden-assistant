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
  AlertCircle,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import type { BOMRow, InventoryItem, ItemVariant } from '@/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type UploadStep = 'select' | 'mapping' | 'confirm';

export default function BOMUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [parsedRows, setParsedRows] = useState<BOMRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

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
        // For images/PDFs, we'd use OCR - for now show mock data
        await parseMockOCR();
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

    const rows: BOMRow[] = jsonData.map((row: any): BOMRow => ({
      name: row['Item Name'] || row['Name'] || row['Product'] || row['Description'] || '',
      quantity: parseInt(row['Qty'] || row['Quantity'] || row['Units'] || '1'),
      unitCost: parseFloat(row['Cost'] || row['Price'] || row['Unit Price'] || row['Rate'] || '0'),
      sku: row['SKU'] || row['Item Code'] || row['Code'] || '',
      size: row['Size'] || '',
      color: row['Color'] || row['Colour'] || '',
      vendor: row['Vendor'] || row['Supplier'] || '',
      hsn: row['HSN'] || row['HSN Code'] || '',
      action: 'create' as const,
      matchedItemId: undefined
    })).filter((row: BOMRow) => row.name);

    setParsedRows(rows);
    setStep('mapping');
  };

  const parseMockOCR = async () => {
    // Simulating OCR parsing - in production this would use Tesseract.js
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockRows: BOMRow[] = [
      { name: 'Blue Kurti - M', quantity: 10, unitCost: 450, sku: 'BK-M-001', size: 'M', color: 'Blue', vendor: 'ABC Textiles', hsn: '6204', action: 'create' },
      { name: 'Red Saree', quantity: 5, unitCost: 800, sku: 'RS-001', size: '', color: 'Red', vendor: 'ABC Textiles', hsn: '5208', action: 'create' },
      { name: 'White Shirt - L', quantity: 15, unitCost: 350, sku: 'WS-L-001', size: 'L', color: 'White', vendor: 'ABC Textiles', hsn: '6205', action: 'create' },
    ];

    setParsedRows(mockRows);
    setStep('mapping');
  };

  const updateRowAction = (index: number, action: 'create' | 'update' | 'ignore') => {
    setParsedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, action } : row
    ));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);

    try {
      const itemsToCreate = parsedRows.filter(row => row.action === 'create');
      
      for (const row of itemsToCreate) {
        const variant: ItemVariant = {
          id: uuidv4(),
          size: row.size,
          color: row.color,
          stock: row.quantity
        };

        const newItem: InventoryItem = {
          id: uuidv4(),
          name: row.name,
          sku: row.sku,
          category: 'General',
          hsn: row.hsn,
          variants: [variant],
          vendor: row.vendor,
          purchasePrice: row.unitCost,
          sellingPrice: Math.round(row.unitCost * 1.4), // 40% markup default
          taxRate: 12, // Default GST rate
          lowStockThreshold: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.inventory.add(newItem);
      }

      toast.success(`Successfully added ${itemsToCreate.length} items to inventory!`);
      navigate('/inventory');
    } catch (error) {
      console.error('Error creating items:', error);
      toast.error('Error creating items. Please try again.');
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
            <h1 className="text-xl font-bold text-foreground">Upload BOM</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'select' && 'Select a file to upload'}
              {step === 'mapping' && 'Review and confirm items'}
              {step === 'confirm' && 'Confirm import'}
            </p>
          </div>
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
                  <p className="text-xs text-muted-foreground">OCR extraction</p>
                </div>
              </button>
            </div>

            {/* Expected Format */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">Expected Columns</h3>
              <p className="text-sm text-muted-foreground">
                Item Name, Quantity, Cost/Price, SKU (optional), Size (optional), Color (optional), Vendor (optional), HSN (optional)
              </p>
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
                <p className="text-xs text-muted-foreground">{parsedRows.length} items found</p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {row.quantity} × ₹{row.unitCost}
                        {row.size && ` • Size: ${row.size}`}
                        {row.color && ` • ${row.color}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateRowAction(index, 'create')}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          row.action === 'create' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-secondary text-muted-foreground'
                        )}
                        title="Create new item"
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
                        title="Update existing item"
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
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items to create:</span>
                <span className="font-medium text-success">
                  {parsedRows.filter(r => r.action === 'create').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Items to update:</span>
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
              <p className="mt-4 font-medium text-foreground">Processing file...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
