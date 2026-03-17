import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Bike, Phone, Loader2, MapPin, UserCircle, Camera, Target, TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const [riderRecord, setRiderRecord] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState('');
  const [delivering, setDelivering] = useState(false);
  // Earnings goal
  const [dailyGoal, setDailyGoal] = useState(10);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [weekDeliveries, setWeekDeliveries] = useState(0);
  const [lastWeekEarnings, setLastWeekEarnings] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      let { data: rider } = await (supabase as any).from('riders').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!rider) {
        const { data: newRider } = await (supabase as any).from('riders').insert({
          user_id: session.user.id, is_available: false, vehicle_type: 'Motorcycle',
        }).select().single();
        rider = newRider;
      }
      setRiderRecord(rider);
      setIsOnline(rider?.is_available || false);

      const { data: activeOrder } = await (supabase as any).from('orders')
        .select('*, shops(shop_name, address)')
        .eq('rider_id', session.user.id)
        .in('status', ['confirmed', 'picked_up'])
        .maybeSingle();
      if (activeOrder) setActiveDelivery(activeOrder);

      if (rider?.is_available && !activeOrder) {
        const { data: available } = await (supabase as any).from('orders')
          .select('*, shops(shop_name, address), order_items(id)')
          .eq('status', 'confirmed').is('rider_id', null);
        if (available) setAvailableOrders(available);
      }

      // Today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await (supabase as any).from('orders')
        .select('delivery_fee, total_amount')
        .eq('rider_id', session.user.id).eq('status', 'delivered')
        .gte('created_at', today);
      setTodayDeliveries(todayOrders?.length || 0);
      setTodayEarnings(todayOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

      // This week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekOrders } = await (supabase as any).from('orders')
        .select('delivery_fee').eq('rider_id', session.user.id).eq('status', 'delivered')
        .gte('created_at', weekStart.toISOString());
      setWeekDeliveries(weekOrders?.length || 0);
      setWeekEarnings(weekOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

      // Last week
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const { data: lwOrders } = await (supabase as any).from('orders')
        .select('delivery_fee').eq('rider_id', session.user.id).eq('status', 'delivered')
        .gte('created_at', lastWeekStart.toISOString()).lt('created_at', weekStart.toISOString());
      setLastWeekEarnings(lwOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

      setLoading(false);
    };
    init();

    const channel = supabase.channel('rider-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const order = payload.new;
          if (payload.eventType === 'UPDATE') {
            if (order.rider_id && order.rider_id !== session.user.id) {
              setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
            }
            if (order.rider_id === session.user.id) {
              setActiveDelivery((prev: any) => prev?.id === order.id ? { ...prev, ...order } : prev);
            }
          }
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && order.status === 'confirmed' && !order.rider_id)) {
            if (isOnline && !activeDelivery) {
              toast('🔔 New delivery available!');
              (supabase as any).from('orders')
                .select('*, shops(shop_name, address), order_items(id)')
                .eq('status', 'confirmed').is('rider_id', null)
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
    } else { setAvailableOrders([]); }
  };

  const acceptOrder = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const { data, error } = await (supabase as any).from('orders')
        .update({ rider_id: session?.user.id })
        .eq('id', orderId).eq('status', 'confirmed').is('rider_id', null)
        .select('*, shops(shop_name, address)').single();
      if (error || !data) {
        toast.error('Order already taken by another rider');
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        return;
      }
      setActiveDelivery(data);
      setAvailableOrders([]);
      toast.success('Order accepted! Head to the shop.');
    } catch { toast.error('Failed to accept order'); }
    finally { setAccepting(null); }
  };

  const updateDeliveryStatus = async (status: 'picked_up' | 'delivered') => {
    if (!activeDelivery) return;

    if (status === 'delivered') {
      if (!deliveryPhoto) {
        toast.error('Please upload a delivery photo to confirm');
        return;
      }
      setDelivering(true);
      try {
        // Upload photo
        const ext = deliveryPhoto.name.split('.').pop();
        const path = `${activeDelivery.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('delivery-proofs').upload(path, deliveryPhoto);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(path);

        await (supabase as any).from('orders').update({ status: 'delivered', delivery_photo_url: urlData.publicUrl }).eq('id', activeDelivery.id);

        const fee = Number(activeDelivery.delivery_fee) || 50;
        const newDeliveries = (riderRecord?.total_deliveries || 0) + 1;
        await (supabase as any).from('riders').update({
          total_earnings: (riderRecord?.total_earnings || 0) + fee,
          total_deliveries: newDeliveries,
        }).eq('user_id', session?.user.id);
        setRiderRecord((prev: any) => prev ? { ...prev, total_earnings: (prev.total_earnings || 0) + fee, total_deliveries: newDeliveries } : prev);
        setActiveDelivery(null);
        setDeliveryPhoto(null);
        setDeliveryPhotoPreview('');
        setTodayDeliveries(prev => prev + 1);
        setTodayEarnings(prev => prev + fee);
        toast.success('Delivery completed! 🎉');

        if (todayDeliveries + 1 >= dailyGoal) {
          toast('🎉 Daily goal reached! Great work!', { duration: 5000 });
        }

        const { data } = await (supabase as any).from('orders')
          .select('*, shops(shop_name, address), order_items(id)')
          .eq('status', 'confirmed').is('rider_id', null);
        if (data) setAvailableOrders(data);
      } catch { toast.error('Failed to complete delivery'); }
      finally { setDelivering(false); }
    } else {
      try {
        await (supabase as any).from('orders').update({ status }).eq('id', activeDelivery.id);
        setActiveDelivery({ ...activeDelivery, status });
        toast.success('Marked as picked up!');
      } catch { toast.error('Failed to update status'); }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const goalProgress = Math.min((todayDeliveries / dailyGoal) * 100, 100);
  const weekChange = lastWeekEarnings > 0 ? Math.round(((weekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100) : 0;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Rider Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/rider/edit-profile')} className="p-2 text-muted-foreground"><UserCircle className="w-5 h-5" /></button>
          <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
        </div>
      </div>

      {/* Online Toggle */}
      <button onClick={toggleOnline} className={`w-full rounded-xl p-5 flex items-center justify-between mb-4 min-h-[64px] ${isOnline ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
        <div className="flex items-center gap-3">
          <Bike className="w-6 h-6" />
          <span className="font-display font-bold text-lg">{isOnline ? "You're Online" : "You're Offline"}</span>
        </div>
        {isOnline ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
      </button>

      {/* Daily Goal Card */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-sm">Daily Goal</h3>
        </div>
        <Progress value={goalProgress} className="h-2.5 mb-2" />
        <p className="text-sm font-semibold">{todayDeliveries} of {dailyGoal} deliveries completed today</p>
        {todayDeliveries < dailyGoal ? (
          <p className="text-xs text-muted-foreground">{dailyGoal - todayDeliveries} more deliveries to reach your goal! 💪</p>
        ) : (
          <p className="text-xs text-accent font-bold">🎉 Daily goal reached! Great work!</p>
        )}
      </div>

      {/* Earnings Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(todayEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(weekEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">
            This Week {weekChange !== 0 && <span className={weekChange > 0 ? 'text-accent' : 'text-destructive'}>({weekChange > 0 ? '↑' : '↓'}{Math.abs(weekChange)}%)</span>}
          </p>
        </div>
      </div>

      {/* Total Earnings */}
      <div className="bg-green-light rounded-xl p-4 mb-4 text-center">
        <p className="font-display font-bold text-2xl">Rs {Math.round(riderRecord?.total_earnings || 0)}</p>
        <p className="text-xs text-muted-foreground">Total Lifetime Earnings • {riderRecord?.total_deliveries || 0} deliveries</p>
      </div>

      {/* Peak Hours */}
      {isOnline && (
        <div className="bg-card rounded-xl border border-border p-3 mb-4 flex items-center gap-3">
          <Flame className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Peak Hours: 12–2 PM & 7–9 PM</p>
            <p className="text-xs text-muted-foreground">
              {new Date().getHours() >= 12 && new Date().getHours() <= 14 || new Date().getHours() >= 19 && new Date().getHours() <= 21
                ? '🔥 High demand right now in your area!'
                : 'Wait for peak hours for more orders'}
            </p>
          </div>
        </div>
      )}

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3">🚀 Active Delivery</h2>
          <div className="bg-card rounded-xl border-2 border-primary/30 p-4">
            <p className="font-semibold text-sm">🏪 {activeDelivery.shops?.shop_name || 'Shop'}</p>
            <p className="text-xs text-muted-foreground mt-1">📍 Shop: {activeDelivery.shops?.address || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">🏠 Deliver to: {activeDelivery.delivery_address}</p>
            {activeDelivery.customer_note && (
              <div className="bg-warning/10 rounded-lg p-2 mt-2 border border-warning/20">
                <p className="text-xs font-bold text-warning">📝 Customer Note</p>
                <p className="text-sm">{activeDelivery.customer_note}</p>
              </div>
            )}
            <p className="text-[10px] font-bold uppercase mt-2 text-primary">Status: {activeDelivery.status?.replace('_', ' ')}</p>

            {activeDelivery.status === 'picked_up' && (
              <div className="mt-3">
                <label className="text-xs font-medium mb-1 block">📸 Delivery Photo (required)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-muted rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">{deliveryPhoto ? 'Change Photo' : 'Take/Upload Photo'}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setDeliveryPhoto(f); setDeliveryPhotoPreview(URL.createObjectURL(f)); }
                    }} />
                  </label>
                </div>
                {deliveryPhotoPreview && (
                  <img src={deliveryPhotoPreview} alt="Proof" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {activeDelivery.status === 'confirmed' && (
                <button onClick={() => updateDeliveryStatus('picked_up')} className="flex-1 bg-primary text-primary-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">
                  Mark Picked Up
                </button>
              )}
              {activeDelivery.status === 'picked_up' && (
                <button onClick={() => updateDeliveryStatus('delivered')} disabled={delivering} className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px] disabled:opacity-50">
                  {delivering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mark Delivered ✓'}
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
                  {order.customer_note && (
                    <p className="text-xs text-warning mt-1">📝 {order.customer_note}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-bold text-accent">Rs {order.delivery_fee} fee</span>
                    <button onClick={() => acceptOrder(order.id)} disabled={accepting === order.id}
                      className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-semibold text-sm min-h-[44px] disabled:opacity-50">
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
