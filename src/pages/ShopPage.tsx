import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Store, Loader2, Flag } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import ProductCard from '@/components/ProductCard';
import FavoriteButton from '@/components/FavoriteButton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shop, Product } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { totalItems, total } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [shopRes, prodRes] = await Promise.all([
        (supabase as any).from('shops').select('*').eq('id', shopId).single(),
        (supabase as any).from('products').select('*').eq('shop_id', shopId).eq('in_stock', true),
      ]);
      if (shopRes.data) setShop(shopRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    };
    fetch();
  }, [shopId]);

  // Check if shop is actually open based on business hours
  const isActuallyOpen = (() => {
    if (!shop?.is_open) return false;
    if (!shop?.business_hours) return shop.is_open;
    const bh = shop.business_hours as any;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    const daySchedule = bh[dayKey];
    if (!daySchedule || !daySchedule.open) return false;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (daySchedule.openTime || '09:00').split(':').map(Number);
    const [closeH, closeM] = (daySchedule.closeTime || '21:00').split(':').map(Number);
    return currentMin >= openH * 60 + openM && currentMin <= closeH * 60 + closeM;
  })();

  const submitReport = async () => {
    if (!reportReason || !session?.user || !shop) return;
    setReporting(true);
    try {
      await (supabase as any).from('reports').insert({
        reported_by: session.user.id,
        reported_user_id: shop.owner_id,
        reason: reportReason,
        description: reportDesc,
      });
      toast.success('Report submitted');
      setReportOpen(false);
    } catch { toast.error('Failed'); }
    finally { setReporting(false); }
  };

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!shop) return <div className="p-6 text-center">Shop not found</div>;

  return (
    <MobileLayout showNav={false}>
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-1">
            <FavoriteButton shopId={shop.id} className="text-primary-foreground" />
            <button onClick={() => setReportOpen(true)} className="p-2 text-primary-foreground/70"><Flag className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
            {shop.logo_url ? <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-primary-foreground" />}
          </div>
          <div className="text-primary-foreground">
            <h1 className="font-display text-xl font-bold">{shop.shop_name}</h1>
            <p className="text-sm opacity-80">{shop.category}</p>
            <div className="flex items-center gap-3 mt-1">
              {shop.rating && shop.rating > 0 && (
                <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /><span className="text-sm font-semibold">{shop.rating}</span></div>
              )}
              {shop.delivery_time && (
                <div className="flex items-center gap-1 opacity-80"><Clock className="w-3.5 h-3.5" /><span className="text-sm">{shop.delivery_time}</span></div>
              )}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActuallyOpen ? 'bg-accent/20 text-accent-foreground' : 'bg-primary-foreground/20'}`}>
                {isActuallyOpen ? '● Open' : '● Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isActuallyOpen && (
        <div className="mx-4 mt-3 bg-warning/10 rounded-xl border border-warning/20 p-3 text-center">
          <p className="text-sm text-warning font-semibold">This shop is currently closed</p>
          <p className="text-xs text-muted-foreground">You can browse products but cannot add to cart</p>
        </div>
      )}

      <div className="px-4 mt-4 pb-24 space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-display font-semibold text-base mb-2">{category}</h2>
            <div className="space-y-2">
              {items.map(p => <ProductCard key={p.id} product={p} shopId={shop.id} shopClosed={!isActuallyOpen} />)}
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products available</p>}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate('/cart')}
              className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between min-h-[56px] active:scale-[0.98] transition-transform shadow-lg">
              <span className="font-display font-semibold">{totalItems} items</span>
              <span className="font-display font-bold text-lg">View Cart • Rs {Math.round(total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Sheet */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
          <SheetHeader><SheetTitle className="font-display">Report Shop</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fake listing">Fake listing</SelectItem>
                <SelectItem value="Wrong items">Wrong items</SelectItem>
                <SelectItem value="Rude behavior">Rude behavior</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Additional details (optional)" className="rounded-xl" />
            <Button onClick={submitReport} disabled={!reportReason || reporting} className="w-full h-12 rounded-xl font-display">
              {reporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
};

export default ShopPage;
