import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useOrders } from '@/contexts/OrderContext';
import { toast } from 'sonner';

const ShopkeeperOrders = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();

  const shopOrders = orders.filter(o => o.shop_id === 'shop-1');
  const pending = shopOrders.filter(o => o.status === 'placed');
  const active = shopOrders.filter(o => o.status === 'confirmed' || o.status === 'picked_up');

  const handleAccept = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed');
    toast.success('Order accepted!');
  };

  const handleCancel = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
    toast.error('Order cancelled');
  };

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
                <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{order.delivery_address}</p>
                <div className="mt-2">
                  {order.items?.map(i => (
                    <p key={i.id} className="text-sm">{i.product?.name} × {i.quantity}</p>
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
        <div>
          <h2 className="font-display font-semibold text-base mb-3">Active Orders</h2>
          <div className="space-y-3">
            {active.map(order => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between">
                  <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase">{order.status}</span>
                </div>
                <p className="font-display font-bold text-sm mt-1">Rs {Math.round(order.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && active.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No orders yet</p>
      )}
    </div>
  );
};

export default ShopkeeperOrders;
