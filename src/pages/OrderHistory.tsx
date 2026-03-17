import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  placed: 'bg-warning text-warning-foreground',
  confirmed: 'bg-primary text-primary-foreground',
  picked_up: 'bg-primary text-primary-foreground',
  delivered: 'bg-accent text-accent-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { addItem, clearCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchOrders = async () => {
      const { data } = await (supabase as any).from('orders')
        .select('*, shops(shop_name), order_items(id, product_id, quantity)')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [session]);

  const handleReorder = async (order: any) => {
    setReordering(order.id);
    try {
      const productIds = order.order_items?.map((i: any) => i.product_id) || [];
      if (productIds.length === 0) { toast.error('No items to reorder'); return; }

      const { data: products } = await (supabase as any).from('products').select('*').in('id', productIds);
      if (!products) { toast.error('Failed to fetch products'); return; }

      clearCart();
      let skipped = 0;
      for (const item of order.order_items) {
        const product = products.find((p: any) => p.id === item.product_id);
        if (!product || !product.in_stock) { skipped++; continue; }
        for (let q = 0; q < item.quantity; q++) {
          addItem(product, order.shop_id);
        }
      }

      if (skipped > 0) {
        toast.info(`${skipped} item${skipped > 1 ? 's were' : ' was'} unavailable and skipped`);
      }
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch { toast.error('Failed to reorder'); }
    finally { setReordering(null); }
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold mb-4">My Orders</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => navigate('/order-tracking', { state: { orderId: order.id } })}
                className="w-full bg-card rounded-xl border border-border p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-semibold text-sm">{order.shops?.shop_name || 'Shop'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString()} • {order.order_items?.length || 0} items
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColors[order.status] || 'bg-muted'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="font-display font-bold">Rs {Math.round(order.total_amount)}</span>
                  {order.status === 'delivered' && (
                    <span
                      onClick={e => { e.stopPropagation(); handleReorder(order); }}
                      className="text-xs text-primary font-medium flex items-center gap-1"
                    >
                      {reordering === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Reorder
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default OrderHistory;
