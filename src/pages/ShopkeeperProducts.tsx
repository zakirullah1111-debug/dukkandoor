import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingBag, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Product } from '@/types';

const productCategories = ['Grocery', 'Bakery', 'Medicine', 'Vegetables', 'Electronics', 'Dairy', 'Snacks', 'Hygiene', 'Bread', 'First Aid'];

const ShopkeeperProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formInStock, setFormInStock] = useState(true);
  const [formStockQty, setFormStockQty] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    const fetch = async () => {
      const { data: shop } = await (supabase as any).from('shops').select('id').eq('owner_id', session.user.id).maybeSingle();
      if (!shop) { navigate('/shopkeeper/setup', { replace: true }); return; }
      setShopId(shop.id);
      const { data: prods } = await (supabase as any).from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false });
      if (prods) setProducts(prods);
      setLoading(false);
      if ((location.state as any)?.openAdd) setIsFormOpen(true);
    };
    fetch();

    const channel = supabase.channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') setProducts(prev => [payload.new as Product, ...prev]);
          else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
          else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, navigate]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormPrice(''); setFormCategory('');
    setFormDiscount('0'); setFormInStock(true); setFormStockQty('');
    setFormImageFile(null); setFormImagePreview(''); setEditingProduct(null);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormPrice(String(product.price));
    setFormCategory(product.category);
    setFormDiscount(String(product.discount_percent));
    setFormInStock(product.in_stock);
    setFormStockQty(product.stock_quantity != null ? String(product.stock_quantity) : '');
    setFormImagePreview(product.image_url || '');
    setFormImageFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formPrice || !formCategory || !shopId) return;
    setSubmitting(true);
    try {
      let imageUrl = editingProduct?.image_url || '';
      if (formImageFile) {
        const ext = formImageFile.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, formImageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const productData: any = {
        name: formName.trim(),
        description: formDesc.trim(),
        price: Number(formPrice),
        category: formCategory,
        discount_percent: Number(formDiscount) || 0,
        in_stock: formInStock,
        image_url: imageUrl,
        shop_id: shopId,
      };
      if (formStockQty !== '') productData.stock_quantity = Number(formStockQty);

      if (editingProduct) {
        const { error } = await (supabase as any).from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await (supabase as any).from('products').insert(productData);
        if (error) throw error;
        toast.success('Product added successfully!');
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) { toast.error(err.message || 'Failed to save product'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await (supabase as any).from('products').delete().eq('id', deleteId);
      toast.success('Product deleted');
    } catch (err: any) { toast.error(err.message || 'Failed to delete'); }
    setDeleteId(null);
  };

  const toggleStock = async (product: Product) => {
    const newStock = !product.in_stock;
    await (supabase as any).from('products').update({ in_stock: newStock }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: newStock } : p));
    toast.success(newStock ? 'Marked as In Stock' : 'Marked as Out of Stock');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">My Products ({products.length})</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map(product => {
          const isLowStock = product.stock_quantity != null && product.stock_quantity <= 3 && product.stock_quantity > 0;
          const isOutOfStock = product.stock_quantity != null && product.stock_quantity === 0;
          return (
            <div key={product.id} className="bg-card rounded-xl border border-border p-3 relative">
              <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              {product.discount_percent > 0 && (
                <span className="absolute top-2 right-2 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  {product.discount_percent}% OFF
                </span>
              )}
              <p className="font-semibold text-sm truncate">{product.name}</p>
              <p className="font-display font-bold text-sm">Rs {product.price}</p>

              {/* Low stock warning */}
              {isLowStock && (
                <div className="flex items-center gap-1 mt-1 text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Low Stock: {product.stock_quantity} left</span>
                </div>
              )}
              {isOutOfStock && (
                <div className="flex items-center gap-1 mt-1 text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Out of Stock</span>
                </div>
              )}
              {product.stock_quantity != null && product.stock_quantity > 3 && (
                <p className="text-[10px] text-muted-foreground mt-1">Stock: {product.stock_quantity}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <button onClick={() => toggleStock(product)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-light text-accent' : 'bg-destructive/10 text-destructive'}`}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEditForm(product)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(product.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}

      <button onClick={() => { resetForm(); setIsFormOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40">
        <Plus className="w-7 h-7" />
      </button>

      <Sheet open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display">{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-full h-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                {formImagePreview ? <img src={formImagePreview} alt="Preview" className="w-full h-full object-cover" /> : <p className="text-sm text-muted-foreground">Tap to upload image</p>}
              </div>
              <label className="text-sm text-primary font-medium cursor-pointer">
                {formImagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFormImageFile(f); setFormImagePreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </div>
            <div><label className="text-sm font-medium mb-1.5 block">Product Name *</label><Input value={formName} onChange={e => setFormName(e.target.value)} className="h-12 rounded-xl" placeholder="e.g., Basmati Rice 5kg" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Description</label><Input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="h-12 rounded-xl" placeholder="Brief description" /></div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category *</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium mb-1.5 block">Price (Rs) *</label><Input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="h-12 rounded-xl" placeholder="0" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Discount %</label><Input type="number" value={formDiscount} onChange={e => setFormDiscount(e.target.value)} className="h-12 rounded-xl" placeholder="0" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Stock Qty</label><Input type="number" value={formStockQty} onChange={e => setFormStockQty(e.target.value)} className="h-12 rounded-xl" placeholder="∞" /></div>
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium">In Stock</label>
              <Switch checked={formInStock} onCheckedChange={setFormInStock} />
            </div>
            <Button onClick={handleSubmit} disabled={!formName.trim() || !formPrice || !formCategory || submitting} className="w-full h-14 text-base font-display font-semibold rounded-xl">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</> : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShopkeeperProducts;
