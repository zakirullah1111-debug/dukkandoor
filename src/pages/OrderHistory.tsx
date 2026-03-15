import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';

const statusColors: Record<string, string> = {
  placed: 'bg-warning text-warning-foreground',
  confirmed: 'bg-primary text-primary-foreground',
  picked_up: 'bg-primary text-primary-foreground',
  delivered: 'bg-accent text-accent-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOrders();

  const myOrders = orders.filter(o => o.customer_id === user?.id);

  return (
    <MobileLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold mb-4">My Orders</h1>

        {myOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map(order => (
              <button
                key={order.id}
                onClick={() => navigate('/order-tracking', { state: { orderId: order.id } })}
                className="w-full bg-card rounded-xl border border-border p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-semibold text-sm">{order.shop?.shop_name || 'Shop'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="font-display font-bold">Rs {Math.round(order.total_amount)}</span>
                  {order.status === 'delivered' && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Reorder
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
