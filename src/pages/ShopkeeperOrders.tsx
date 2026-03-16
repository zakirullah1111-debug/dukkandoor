import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ShopkeeperOrders = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetch = async () => {
      const { data: shop } = await (supabase as any).from('shops').select('id').eq('owner_id', session.user.id).maybeSingle();
      if (!shop) return;
      setShopId(shop.id);

      const { data } = await (supabase as any).from('orders')
        .select('*, order_items(*, products(name)), profiles!orders_customer_id_fkey(name, phone)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase.channel('shopkeeper-orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new.shop_id === shopId) {
            // Refetch to get full data with joins
            fetch();
            toast('🔔 New order!');
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleAccept = async (orderId: string) => {
    try {
      await (supabase as any).from('orders').update({ status: 'confirmed' }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
      toast.success('Order accepted!');
    } catch {
      toast.error('Failed to accept order');
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.error('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const pending = orders.filter(o => o.status === 'placed');
  const active = orders.filter(o => o.status === 'confirmed' || o.status === 'picked_up');
  const completed = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Orders</h1>
      </div>

      {pending.length > 0 && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3 text-destructive">🔴 Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(order => (
              <div key={order.id} className="bg-card rounded-xl border-2 border-destructive/20 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">👤 {order.profiles?.name || 'Customer'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">📍 {order.delivery_address}</p>
                <div className="mt-2">
                  {order.order_items?.map((i: any) => (
                    <p key={i.id} className="text-sm">{i.products?.name || 'Item'} × {i.quantity}</p>
                  ))}
                </div>
                <p className="font-display font-bold text-sm mt-2">Rs {Math.round(order.total_amount)}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleAccept(order.id)} className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 flex items-center justify-center gap-1 font-semibold text-sm min-h-[44px]">
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button onClick={() => handleCancel(order.id)} className="flex-1 bg-destructive/10 text-destructive rounded-lg p-3 flex items-center justify-center gap-1 font-semibold text-sm min-h-[44px]">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3">Active Orders</h2>
          <div className="space-y-3">
            {active.map(order => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between">
                  <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase">{order.status.replace('_', ' ')}</span>
                </div>
                <p className="font-display font-bold text-sm mt-1">Rs {Math.round(order.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base mb-3 text-muted-foreground">Past Orders</h2>
          <div className="space-y-2">
            {completed.slice(0, 10).map(order => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">#{order.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">Rs {Math.round(order.total_amount)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-light text-accent' : 'bg-destructive/10 text-destructive'}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && <p className="text-center text-muted-foreground py-12">No orders yet</p>}
    </div>
  );
};

export default ShopkeeperOrders;
