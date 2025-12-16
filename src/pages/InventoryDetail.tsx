import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Edit2, Save, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  price: number;
  cost_price: number;
  gst_rate: number;
  sales_count: number;
  size: string | null;
  color: string | null;
  category: string | null;
  hsn_code: string | null;
  last_sold_at: string | null;
}

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setItem(data);
      setEditData(data);
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Item not found');
      navigate('/inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: editData.name,
          sku: editData.sku,
          quantity: editData.quantity,
          price: editData.price,
          cost_price: editData.cost_price,
          gst_rate: editData.gst_rate,
          size: editData.size,
          color: editData.color,
          category: editData.category,
          hsn_code: editData.hsn_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      setItem({ ...item, ...editData } as InventoryItem);
      setIsEditing(false);
      toast.success(t('product_updated'));
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(t('update_error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title={t('product_details')} hideNav>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!item) return null;

  const isLowStock = item.quantity <= 5;
  const isTopSeller = item.sales_count > 10;

  return (
    <AppLayout title={t('product_details')} hideNav>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/inventory')} className="p-2 rounded-xl bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{t('product_details')}</h1>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
            >
              <Edit2 className="w-4 h-4" />
              {t('edit_product')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(item);
                }}
                className="p-2 rounded-xl bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {t('save')}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Product Header Card */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-16 h-16 rounded-xl flex items-center justify-center',
                isLowStock ? 'bg-destructive/10' : isTopSeller ? 'bg-warning/10' : 'bg-secondary'
              )}>
                <Package className={cn(
                  'w-8 h-8',
                  isLowStock ? 'text-destructive' : isTopSeller ? 'text-warning' : 'text-muted-foreground'
                )} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="input-field text-lg font-bold mb-1"
                    placeholder="Product name"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-foreground">{item.name}</h2>
                )}
                <div className="flex gap-2 mt-2">
                  {isLowStock && (
                    <span className="badge-low-stock flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('low_stock')}
                    </span>
                  )}
                  {isTopSeller && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/10 text-warning flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {t('top_selling')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-xs text-muted-foreground">{t('stock')}</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.quantity || 0}
                  onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 0 })}
                  className="input-field text-center text-lg font-bold mt-1"
                />
              ) : (
                <p className={cn("text-xl font-bold", isLowStock ? "text-destructive" : "text-foreground")}>
                  {item.quantity}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-xs text-muted-foreground">{t('sales_count')}</p>
              <p className="text-xl font-bold text-primary">{item.sales_count}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-xs text-muted-foreground">{t('gst_rate')}</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.gst_rate || 0}
                  onChange={(e) => setEditData({ ...editData, gst_rate: parseFloat(e.target.value) || 0 })}
                  className="input-field text-center text-lg font-bold mt-1"
                />
              ) : (
                <p className="text-xl font-bold text-foreground">{item.gst_rate}%</p>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="p-4 rounded-2xl gold-gradient text-primary-foreground">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">{t('selling_price')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.price || 0}
                    onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                    className="bg-white/20 border-white/30 text-white text-2xl font-bold rounded-lg px-2 py-1 mt-1 w-full"
                  />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(Number(item.price))}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">{t('cost_price')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.cost_price || 0}
                    onChange={(e) => setEditData({ ...editData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="bg-white/20 border-white/30 text-white text-lg font-semibold rounded-lg px-2 py-1 mt-1 w-24"
                  />
                ) : (
                  <p className="text-lg font-semibold">{formatCurrency(Number(item.cost_price))}</p>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-semibold text-foreground">{t('product_details')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">{t('sku')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.sku || ''}
                    onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                    className="input-field mt-1"
                    placeholder="SKU"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.sku || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('category')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.category || ''}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Category"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.category || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('size')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.size || ''}
                    onChange={(e) => setEditData({ ...editData, size: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Size"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.size || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('color')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.color || ''}
                    onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Color"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.color || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('hsn_code')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.hsn_code || ''}
                    onChange={(e) => setEditData({ ...editData, hsn_code: e.target.value })}
                    className="input-field mt-1"
                    placeholder="HSN Code"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.hsn_code || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('last_sold')}</label>
                <p className="text-sm font-medium text-foreground">
                  {item.last_sold_at 
                    ? new Date(item.last_sold_at).toLocaleDateString('en-IN')
                    : t('never')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
