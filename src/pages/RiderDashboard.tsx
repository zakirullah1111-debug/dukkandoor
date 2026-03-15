import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Package, Bike, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { mockRiders, mockShops } from '@/data/mockData';
import { toast } from 'sonner';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, updateOrderStatus, getPendingOrdersForRiders } = useOrders();
  const [isOnline, setIsOnline] = useState(true);

  const rider = mockRiders[0];
  const availableOrders = getPendingOrdersForRiders();
  const myDeliveries = orders.filter(o => o.rider_id === rider.id);
  const activeDelivery = myDeliveries.find(o => o.status === 'confirmed' || o.status === 'picked_up');
  const todayEarnings = myDeliveries.filter(o => o.status === 'delivered').reduce((s, o) => s + o.delivery_fee, 0);

  const acceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed', rider.id);
    toast.success('Order accepted!');
  };

  const updateStatus = (orderId: string, status: 'picked_up' | 'delivered') => {
    updateOrderStatus(orderId, status);
    toast.success(status === 'picked_up' ? 'Marked as picked up!' : 'Delivery completed! 🎉');
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Rider Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.name || rider.user.name}</p>
        </div>
        <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
      </div>

      {/* Online Toggle */}
      <button onClick={() => setIsOnline(!isOnline)} className={`w-full rounded-xl p-5 flex items-center justify-between mb-5 min-h-[64px] ${isOnline ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
        <div className="flex items-center gap-3">
          <Bike className="w-6 h-6" />
          <span className="font-display font-bold text-lg">{isOnline ? "You're Online" : "You're Offline"}</span>
        </div>
        {isOnline ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
      </button>

      {/* Earnings */}
      <div className="bg-green-light rounded-xl p-4 mb-5 text-center">
        <DollarSign className="w-6 h-6 mx-auto text-accent mb-1" />
        <p className="font-display font-bold text-2xl">Rs {rider.total_earnings + todayEarnings}</p>
        <p className="text-xs text-muted-foreground">Today: Rs {todayEarnings}</p>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3">🚀 Active Delivery</h2>
          <div className="bg-card rounded-xl border-2 border-primary/30 p-4">
            <p className="font-semibold text-sm">{mockShops.find(s => s.id === activeDelivery.shop_id)?.shop_name}</p>
            <p className="text-xs text-muted-foreground mt-1">📍 {activeDelivery.delivery_address}</p>
            <p className="text-xs text-muted-foreground">{activeDelivery.items?.length || 0} items • Rs {activeDelivery.delivery_fee} fee</p>
            <div className="flex gap-2 mt-3">
              {activeDelivery.status === 'confirmed' && (
                <button onClick={() => updateStatus(activeDelivery.id, 'picked_up')} className="flex-1 bg-primary text-primary-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">
                  Mark Picked Up
                </button>
              )}
              {activeDelivery.status === 'picked_up' && (
                <button onClick={() => updateStatus(activeDelivery.id, 'delivered')} className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">
                  Mark Delivered ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Orders */}
      {isOnline && !activeDelivery && (
        <div>
          <h2 className="font-display font-semibold text-base mb-3">Available Orders</h2>
          {availableOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders available right now</p>
          ) : (
            <div className="space-y-3">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-semibold text-sm">{mockShops.find(s => s.id === order.shop_id)?.shop_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">📍 {order.delivery_address}</p>
                  <p className="text-xs text-muted-foreground">{order.items?.length || 0} items</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-bold text-accent">Rs {order.delivery_fee} fee</span>
                    <button onClick={() => acceptOrder(order.id)} className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-semibold text-sm min-h-[44px]">
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
