import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, ToggleLeft, ToggleRight, Plus, ChevronRight, Store, Loader2, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultHours = days.reduce((acc, d) => ({ ...acc, [d]: { open: true, openTime: '09:00', closeTime: '21:00' } }), {} as any);

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { t } = useLanguage();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState<any>(defaultHours);
  const [savingHours, setSavingHours] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    const fetchShop = async () => {
      const { data: shopData } = await (supabase as any).from('shops').select('*').eq('owner_id', session.user.id).maybeSingle();
      if (!shopData) { navigate('/shopkeeper/setup', { replace: true }); return; }
      setShop(shopData);
      if (shopData.business_hours) setBusinessHours(shopData.business_hours);

      const [ordersRes, productsRes] = await Promise.all([
        (supabase as any).from('orders').select('id, status, total_amount, created_at').eq('shop_id', shopData.id),
        (supabase as any).from('products').select('id, name, stock_quantity, in_stock').eq('shop_id', shopData.id),
      ]);

      const orders = ordersRes.data || [];
      setPendingCount(orders.filter((o: any) => o.status === 'placed').length);
      const today = new Date().toDateString();
      setTodayEarnings(orders.filter((o: any) => o.status === 'delivered' && new Date(o.created_at).toDateString() === today).reduce((s: number, o: any) => s + Number(o.total_amount), 0));
      setProductCount(productsRes.data?.length || 0);

      const lowStock = (productsRes.data || []).filter((p: any) => p.stock_quantity != null && p.stock_quantity <= 3 && p.stock_quantity > 0);
      setLowStockProducts(lowStock);

      const todayDelivered = orders.filter((o: any) => o.status === 'delivered' && new Date(o.created_at).toDateString() === today);
      const todayCancelled = orders.filter((o: any) => o.status === 'cancelled' && new Date(o.created_at).toDateString() === today);
      const totalSales = todayDelivered.reduce((s: number, o: any) => s + Number(o.total_amount), 0);

      const lastDismissed = localStorage.getItem(`summary_dismissed_${shopData.id}`);
      const now = new Date();
      if (now.getHours() >= 20 || (now.getHours() < 10 && lastDismissed !== today)) {
        setSummary({ completed: todayDelivered.length, cancelled: todayCancelled.length, totalSales, rating: shopData.rating || 0 });
        setShowSummary(true);
      }
      setLoading(false);
    };
    fetchShop();

    const channel = supabase.channel('shopkeeper-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
        if (payload.new.shop_id === shop?.id) {
          setPendingCount(prev => prev + 1);
          toast('🔔 ' + t('incoming_orders'));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, navigate]);

  const toggleShopStatus = async () => {
    if (!shop) return;
    setToggling(true);
    const newStatus = !shop.is_open;
    await (supabase as any).from('shops').update({ is_open: newStatus }).eq('id', shop.id);
    setShop({ ...shop, is_open: newStatus });
    toast.success(newStatus ? t('shop_is_open') : t('shop_is_closed'));
    setToggling(false);
  };

  const saveBusinessHours = async () => {
    if (!shop) return;
    setSavingHours(true);
    try {
      await (supabase as any).from('shops').update({ business_hours: businessHours }).eq('id', shop.id);
      setShop({ ...shop, business_hours: businessHours });
      toast.success(t('success'));
      setHoursOpen(false);
    } catch { toast.error(t('error_retry')); }
    finally { setSavingHours(false); }
  };

  const dismissSummary = () => {
    setShowSummary(false);
    if (shop) localStorage.setItem(`summary_dismissed_${shop.id}`, new Date().toDateString());
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Store className="w-5 h-5 text-primary-foreground" /></div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold">{shop?.shop_name}</h1>
            <p className="text-sm text-muted-foreground">{t('shopkeeper_dashboard')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">{t('logout')}</button>
        </div>
      </div>

      {showSummary && summary && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-5 relative">
          <button onClick={dismissSummary} className="absolute top-2 end-2 p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
          <p className="font-display font-semibold text-sm mb-2">📊 {t('daily_summary')}</p>
          <div className="text-sm space-y-1">
            <p>✅ {summary.completed} {t('orders_completed')}</p>
            <p>❌ {summary.cancelled} {t('orders_cancelled')}</p>
            <p>💰 {t('total_sales')}: PKR {Math.round(summary.totalSales)}</p>
            <p>⭐ {t('shop_rating')}: {Number(summary.rating).toFixed(1)}</p>
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-3 mb-5">
          <p className="text-xs font-bold text-destructive mb-1">{t('low_stock_alerts')}</p>
          {lowStockProducts.map(p => (
            <p key={p.id} className="text-sm">📦 {p.name} — <span className="font-bold text-destructive">{p.stock_quantity}</span> left!</p>
          ))}
        </div>
      )}

      <button onClick={toggleShopStatus} disabled={toggling} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between mb-3 min-h-[56px]">
        <span className="font-display font-semibold">{t('shop_status')}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${shop?.is_open ? 'text-accent' : 'text-destructive'}`}>{shop?.is_open ? t('open') : t('closed')}</span>
          {shop?.is_open ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
        </div>
      </button>

      <button onClick={() => setHoursOpen(true)} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between mb-5 min-h-[52px]">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-sm">{t('business_hours')}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(todayEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">{t('todays_earnings')}</p>
        </div>
        <div className="bg-orange-light rounded-xl p-3 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">{t('pending_orders')}</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <ShoppingBag className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="font-display font-bold text-lg">{productCount}</p>
          <p className="text-[10px] text-muted-foreground">{t('products')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={() => navigate('/shopkeeper/orders')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">{t('incoming_orders')}</span>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
        <button onClick={() => navigate('/shopkeeper/products')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">{t('my_products')}</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate('/shopkeeper/products', { state: { openAdd: true } })} className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 min-h-[52px] font-display font-semibold active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          {t('add_new_product')}
        </button>
      </div>

      <Sheet open={hoursOpen} onOpenChange={setHoursOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader><SheetTitle className="font-display">{t('business_hours')}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            {days.map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium capitalize">{day.slice(0, 3)}</span>
                <Switch checked={businessHours[day]?.open ?? true} onCheckedChange={v => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: v } }))} />
                {businessHours[day]?.open !== false && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input type="time" value={businessHours[day]?.openTime || '09:00'} onChange={e => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], openTime: e.target.value } }))} className="h-10 rounded-lg text-sm" />
                    <span className="text-muted-foreground text-xs">→</span>
                    <Input type="time" value={businessHours[day]?.closeTime || '21:00'} onChange={e => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], closeTime: e.target.value } }))} className="h-10 rounded-lg text-sm" />
                  </div>
                )}
              </div>
            ))}
            <Button onClick={saveBusinessHours} disabled={savingHours} className="w-full h-12 rounded-xl font-display">
              {savingHours ? t('loading') : t('save_business_hours')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ShopkeeperDashboard;
