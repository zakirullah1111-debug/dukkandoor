import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, ToggleLeft, ToggleRight, Plus, ChevronRight, Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const fetchShop = async () => {
      const { data: shopData } = await (supabase as any).from('shops').select('*').eq('owner_id', session.user.id).maybeSingle();
      if (!shopData) {
        navigate('/shopkeeper/setup', { replace: true });
        return;
      }
      setShop(shopData);

      // Fetch stats
      const [ordersRes, productsRes] = await Promise.all([
        (supabase as any).from('orders').select('id, status, total_amount, created_at').eq('shop_id', shopData.id),
        (supabase as any).from('products').select('id').eq('shop_id', shopData.id),
      ]);

      const orders = ordersRes.data || [];
      setPendingCount(orders.filter((o: any) => o.status === 'placed').length);
      const today = new Date().toDateString();
      setTodayEarnings(orders.filter((o: any) => o.status === 'delivered' && new Date(o.created_at).toDateString() === today)
        .reduce((s: number, o: any) => s + Number(o.total_amount), 0));
      setProductCount(productsRes.data?.length || 0);
      setLoading(false);
    };
    fetchShop();

    // Realtime for new orders
    const channel = supabase.channel('shopkeeper-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          if (payload.new.shop_id === shop?.id) {
            setPendingCount(prev => prev + 1);
            toast('🔔 New order received!', { description: 'Check your incoming orders' });
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, navigate]);

  const toggleShopStatus = async () => {
    if (!shop) return;
    setToggling(true);
    const newStatus = !shop.is_open;
    await (supabase as any).from('shops').update({ is_open: newStatus }).eq('id', shop.id);
    setShop({ ...shop, is_open: newStatus });
    toast.success(newStatus ? 'Shop is now OPEN' : 'Shop is now CLOSED');
    setToggling(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold">{shop?.shop_name}</h1>
            <p className="text-sm text-muted-foreground">Shopkeeper Dashboard</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
      </div>

      {/* Open/Close Toggle */}
      <button onClick={toggleShopStatus} disabled={toggling} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between mb-5 min-h-[56px]">
        <span className="font-display font-semibold">Shop Status</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${shop?.is_open ? 'text-accent' : 'text-destructive'}`}>{shop?.is_open ? 'OPEN' : 'CLOSED'}</span>
          {shop?.is_open ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(todayEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">Today's Earnings</p>
        </div>
        <div className="bg-orange-light rounded-xl p-3 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending Orders</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <ShoppingBag className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="font-display font-bold text-lg">{productCount}</p>
          <p className="text-[10px] text-muted-foreground">Products</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button onClick={() => navigate('/shopkeeper/orders')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">Incoming Orders</span>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
        <button onClick={() => navigate('/shopkeeper/products')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">My Products</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate('/shopkeeper/products', { state: { openAdd: true } })} className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 min-h-[52px] font-display font-semibold active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;
