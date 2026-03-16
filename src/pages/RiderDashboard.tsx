import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Bike, Phone, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const [riderRecord, setRiderRecord] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      // Get or create rider record
      let { data: rider } = await (supabase as any).from('riders').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!rider) {
        const { data: newRider } = await (supabase as any).from('riders').insert({
          user_id: session.user.id,
          is_available: false,
          vehicle_type: 'Motorcycle',
        }).select().single();
        rider = newRider;
      }
      setRiderRecord(rider);
      setIsOnline(rider?.is_available || false);

      // Fetch active delivery
      const { data: activeOrder } = await (supabase as any).from('orders')
        .select('*, shops(shop_name, address)')
        .eq('rider_id', session.user.id)
        .in('status', ['confirmed', 'picked_up'])
        .maybeSingle();
      if (activeOrder) setActiveDelivery(activeOrder);

      // Fetch available orders
      if (rider?.is_available && !activeOrder) {
        const { data: available } = await (supabase as any).from('orders')
          .select('*, shops(shop_name, address), order_items(id)')
          .eq('status', 'confirmed')
          .is('rider_id', null);
        if (available) setAvailableOrders(available);
      }
      setLoading(false);
    };
    init();

    // Realtime for new confirmed orders
    const channel = supabase.channel('rider-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const order = payload.new;
          if (payload.eventType === 'UPDATE') {
            // If an order we were showing got claimed by another rider
            if (order.rider_id && order.rider_id !== session.user.id) {
              setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
            }
            // If it's our active delivery
            if (order.rider_id === session.user.id) {
              setActiveDelivery((prev: any) => prev?.id === order.id ? { ...prev, ...order } : prev);
            }
          }
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && order.status === 'confirmed' && !order.rider_id)) {
            // New available order
            if (isOnline && !activeDelivery) {
              toast('🔔 New delivery available!');
              // Refetch available orders
              (supabase as any).from('orders')
                .select('*, shops(shop_name, address), order_items(id)')
                .eq('status', 'confirmed')
                .is('rider_id', null)
                .then(({ data }: any) => { if (data) setAvailableOrders(data); });
            }
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    await (supabase as any).from('riders').update({ is_available: newStatus }).eq('user_id', session?.user.id);
    setIsOnline(newStatus);
    toast.success(newStatus ? "You're now online!" : "You're now offline");

    if (newStatus && !activeDelivery) {
      const { data } = await (supabase as any).from('orders')
        .select('*, shops(shop_name, address), order_items(id)')
        .eq('status', 'confirmed').is('rider_id', null);
      if (data) setAvailableOrders(data);
    } else {
      setAvailableOrders([]);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const { data, error } = await (supabase as any).from('orders')
        .update({ rider_id: session?.user.id })
        .eq('id', orderId)
        .eq('status', 'confirmed')
        .is('rider_id', null)
        .select('*, shops(shop_name, address)')
        .single();

      if (error || !data) {
        toast.error('Order already taken by another rider');
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        return;
      }

      setActiveDelivery(data);
      setAvailableOrders([]);
      toast.success('Order accepted! Head to the shop.');
    } catch {
      toast.error('Failed to accept order');
    } finally {
      setAccepting(null);
    }
  };

  const updateDeliveryStatus = async (status: 'picked_up' | 'delivered') => {
    if (!activeDelivery) return;
    try {
      await (supabase as any).from('orders').update({ status }).eq('id', activeDelivery.id);

      if (status === 'delivered') {
        // Increment earnings
        const fee = Number(activeDelivery.delivery_fee) || 50;
        await (supabase as any).from('riders').update({
          total_earnings: (riderRecord?.total_earnings || 0) + fee,
        }).eq('user_id', session?.user.id);
        setRiderRecord((prev: any) => prev ? { ...prev, total_earnings: (prev.total_earnings || 0) + fee } : prev);
        setActiveDelivery(null);
        toast.success('Delivery completed! 🎉');

        // Fetch new available orders
        const { data } = await (supabase as any).from('orders')
          .select('*, shops(shop_name, address), order_items(id)')
          .eq('status', 'confirmed').is('rider_id', null);
        if (data) setAvailableOrders(data);
      } else {
        setActiveDelivery({ ...activeDelivery, status });
        toast.success('Marked as picked up!');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Rider Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </div>
        <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
      </div>

      {/* Online Toggle */}
      <button onClick={toggleOnline} className={`w-full rounded-xl p-5 flex items-center justify-between mb-5 min-h-[64px] ${isOnline ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
        <div className="flex items-center gap-3">
          <Bike className="w-6 h-6" />
          <span className="font-display font-bold text-lg">{isOnline ? "You're Online" : "You're Offline"}</span>
        </div>
        {isOnline ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
      </button>

      {/* Earnings */}
      <div className="bg-green-light rounded-xl p-4 mb-5 text-center">
        <DollarSign className="w-6 h-6 mx-auto text-accent mb-1" />
        <p className="font-display font-bold text-2xl">Rs {Math.round(riderRecord?.total_earnings || 0)}</p>
        <p className="text-xs text-muted-foreground">Total Earnings</p>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3">🚀 Active Delivery</h2>
          <div className="bg-card rounded-xl border-2 border-primary/30 p-4">
            <p className="font-semibold text-sm">🏪 {activeDelivery.shops?.shop_name || 'Shop'}</p>
            <p className="text-xs text-muted-foreground mt-1">📍 Shop: {activeDelivery.shops?.address || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">🏠 Deliver to: {activeDelivery.delivery_address}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeDelivery.order_items?.length || '?'} items • Rs {activeDelivery.delivery_fee} fee</p>
            <p className="text-[10px] font-bold uppercase mt-2 text-primary">Status: {activeDelivery.status?.replace('_', ' ')}</p>
            <div className="flex gap-2 mt-3">
              {activeDelivery.status === 'confirmed' && (
                <button onClick={() => updateDeliveryStatus('picked_up')} className="flex-1 bg-primary text-primary-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">
                  Mark Picked Up
                </button>
              )}
              {activeDelivery.status === 'picked_up' && (
                <button onClick={() => updateDeliveryStatus('delivered')} className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">
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
                  <p className="font-semibold text-sm">🏪 {order.shops?.shop_name || 'Shop'}</p>
                  <p className="text-xs text-muted-foreground mt-1">📍 {order.delivery_address}</p>
                  <p className="text-xs text-muted-foreground">{order.order_items?.length || 0} items</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-bold text-accent">Rs {order.delivery_fee} fee</span>
                    <button
                      onClick={() => acceptOrder(order.id)}
                      disabled={accepting === order.id}
                      className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-semibold text-sm min-h-[44px] disabled:opacity-50"
                    >
                      {accepting === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
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
