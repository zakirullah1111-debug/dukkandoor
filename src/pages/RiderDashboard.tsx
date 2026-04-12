import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Bike, Loader2, UserCircle, Camera, Target, TrendingUp, Flame, MessageCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import LogoHeader from '@/components/LogoHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import ChatWindow from '@/components/ChatWindow';
import RiderMapView from '@/components/RiderMapView';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { t } = useLanguage();
  const [riderRecord, setRiderRecord] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [dailyGoal] = useState(10);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [lastWeekEarnings, setLastWeekEarnings] = useState(0);
  // Chat
  const [showChat, setShowChat] = useState(false);
  // Location
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // FIX: refs to avoid stale closures inside realtime callback
  const isOnlineRef = useRef(isOnline);
  const activeDeliveryRef = useRef(activeDelivery);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { activeDeliveryRef.current = activeDelivery; }, [activeDelivery]);

  // GPS location broadcasting
  useEffect(() => {
    if (!activeDelivery || !session?.user || !isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        // FIX: guard against null session before updating DB
        if (session?.user?.id) {
          (supabase as any).from('riders')
            .update({ current_lat: null, current_lng: null })
            .eq('user_id', session.user.id);
        }
      }
      return;
    }

    if (!navigator.geolocation) return;

    const updateLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setMyLat(latitude);
      setMyLng(longitude);
      (supabase as any).from('riders').update({
        current_lat: latitude,
        current_lng: longitude,
        location_updated_at: new Date().toISOString(),
      }).eq('user_id', session.user.id);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(updateLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeDelivery, session, isOnline]);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      try {
        let { data: rider } = await (supabase as any).from('riders').select('*').eq('user_id', session.user.id).maybeSingle();
        if (!rider) {
          const { data: newRider } = await (supabase as any).from('riders')
            .insert({ user_id: session.user.id, is_available: false, vehicle_type: 'Motorcycle' })
            .select().single();
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

        const today = new Date().toISOString().split('T')[0];
        const { data: todayOrders } = await (supabase as any).from('orders')
          .select('delivery_fee')
          .eq('rider_id', session.user.id)
          .eq('status', 'delivered')
          .gte('created_at', today);
        setTodayDeliveries(todayOrders?.length || 0);
        setTodayEarnings(todayOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const { data: weekOrders } = await (supabase as any).from('orders')
          .select('delivery_fee')
          .eq('rider_id', session.user.id)
          .eq('status', 'delivered')
          .gte('created_at', weekStart.toISOString());
        setWeekEarnings(weekOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const { data: lwOrders } = await (supabase as any).from('orders')
          .select('delivery_fee')
          .eq('rider_id', session.user.id)
          .eq('status', 'delivered')
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', weekStart.toISOString());
        setLastWeekEarnings(lwOrders?.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0) || 0);

      } catch {
        toast.error(t('error_retry'));
      } finally {
        setLoading(false);
      }
    };
    init();

    const channel = supabase.channel('rider-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        const order = payload.new;
        // FIX: use refs instead of stale state values
        if (payload.eventType === 'UPDATE') {
          if (order.rider_id && order.rider_id !== session.user.id) {
            setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
          }
          if (order.rider_id === session.user.id) {
            setActiveDelivery((prev: any) => prev?.id === order.id ? { ...prev, ...order } : prev);
          }
        }
        if (payload.eventType === 'INSERT' ||
          (payload.eventType === 'UPDATE' && order.status === 'confirmed' && !order.rider_id)) {
          // FIX: read from refs — not stale captured state
          if (isOnlineRef.current && !activeDeliveryRef.current) {
            toast('🔔 ' + t('new_order_available'));
            (supabase as any).from('orders')
              .select('*, shops(shop_name, address), order_items(id)')
              .eq('status', 'confirmed').is('rider_id', null)
              .then(({ data }: any) => { if (data) setAvailableOrders(data); });
          }
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    await (supabase as any).from('riders').update({ is_available: newStatus }).eq('user_id', session?.user.id);
    setIsOnline(newStatus);
    toast.success(newStatus ? t('go_online') : t('go_offline'));
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
        .eq('id', orderId).eq('status', 'confirmed').is('rider_id', null)
        .select('*, shops(shop_name, address)').single();
      if (error || !data) {
        toast.error(t('error_retry'));
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        return;
      }
      setActiveDelivery(data);
      setAvailableOrders([]);
      toast.success(t('accept_order'));
    } catch { toast.error(t('error_retry')); }
    finally { setAccepting(null); }
  };

  const updateDeliveryStatus = async (status: 'picked_up' | 'delivered') => {
    if (!activeDelivery) return;
    if (status === 'delivered') {
      if (!deliveryPhoto) { toast.error(t('delivery_photo_required')); return; }
      setDelivering(true);
      try {
        const ext = deliveryPhoto.name.split('.').pop();
        const path = `${activeDelivery.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('delivery-proofs').upload(path, deliveryPhoto);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(path);

        await (supabase as any).from('orders')
          .update({ status: 'delivered', delivery_photo_url: urlData.publicUrl })
          .eq('id', activeDelivery.id);

        const fee = Number(activeDelivery.delivery_fee) || 50;
        const newDeliveries = (riderRecord?.total_deliveries || 0) + 1;
        await (supabase as any).from('riders').update({
          total_earnings: (riderRecord?.total_earnings || 0) + fee,
          total_deliveries: newDeliveries,
          current_lat: null,
          current_lng: null,
        }).eq('user_id', session?.user.id);

        setRiderRecord((prev: any) => prev ? {
          ...prev,
          total_earnings: (prev.total_earnings || 0) + fee,
          total_deliveries: newDeliveries,
        } : prev);

        setActiveDelivery(null);
        setDeliveryPhoto(null);
        setDeliveryPhotoPreview('');
        setTodayDeliveries(prev => prev + 1);
        setTodayEarnings(prev => prev + fee);
        toast.success(t('delivery_completed'));

        if (todayDeliveries + 1 >= dailyGoal) {
          toast(t('daily_goal_reached'), { duration: 5000 });
        }

        const { data } = await (supabase as any).from('orders')
          .select('*, shops(shop_name, address), order_items(id)')
          .eq('status', 'confirmed').is('rider_id', null);
        if (data) setAvailableOrders(data);

      } catch { toast.error(t('error_retry')); }
      finally { setDelivering(false); }
    } else {
      try {
        await (supabase as any).from('orders').update({ status }).eq('id', activeDelivery.id);
        setActiveDelivery({ ...activeDelivery, status });
        toast.success(t('mark_picked_up'));
      } catch { toast.error(t('error_retry')); }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (showChat && activeDelivery) {
    return (
      <ChatWindow
        orderId={activeDelivery.id}
        receiverId={activeDelivery.customer_id}
        receiverName="Customer"
        receiverRole="Customer"
        orderStatus={activeDelivery.status}
        onClose={() => setShowChat(false)}
      />
    );
  }

  const goalProgress = Math.min((todayDeliveries / dailyGoal) * 100, 100);
  const weekChange = lastWeekEarnings > 0
    ? Math.round(((weekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-6">
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-2">
        <LogoHeader />
      </div>
      <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">{t('rider_dashboard')}</h1>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={() => navigate('/rider/edit-profile')} className="p-2 text-muted-foreground">
            <UserCircle className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <button
        onClick={toggleOnline}
        className={`w-full rounded-xl p-5 flex items-center justify-between mb-4 min-h-[64px] ${isOnline ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}
      >
        <div className="flex items-center gap-3">
          <Bike className="w-6 h-6" />
          <span className="font-display font-bold text-lg">{isOnline ? t('go_online') : t('go_offline')}</span>
        </div>
        {isOnline ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
      </button>

      {activeDelivery && isOnline && (
        <div className="bg-accent/10 rounded-xl p-2 mb-3 text-center">
          <p className="text-xs text-accent font-medium">{t('location_shared')}</p>
        </div>
      )}

      {/* Daily Goal */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-sm">{t('daily_goal')}</h3>
        </div>
        <Progress value={goalProgress} className="h-2.5 mb-2" />
        <p className="text-sm font-semibold">{todayDeliveries} {t('of')} {dailyGoal} {t('deliveries_completed_today')}</p>
        {todayDeliveries < dailyGoal ? (
          <p className="text-xs text-muted-foreground">{dailyGoal - todayDeliveries} {t('more_to_goal')}</p>
        ) : (
          <p className="text-xs text-accent font-bold">{t('daily_goal_reached')}</p>
        )}
      </div>

      {/* Earnings */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(todayEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">{t('today')}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(weekEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">
            {t('this_week')}{' '}
            {weekChange !== 0 && (
              <span className={weekChange > 0 ? 'text-accent' : 'text-destructive'}>
                ({weekChange > 0 ? '↑' : '↓'}{Math.abs(weekChange)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-green-light rounded-xl p-4 mb-4 text-center">
        <p className="font-display font-bold text-2xl">Rs {Math.round(riderRecord?.total_earnings || 0)}</p>
        <p className="text-xs text-muted-foreground">{t('total_lifetime')} • {riderRecord?.total_deliveries || 0} {t('deliveries')}</p>
      </div>

      {isOnline && (
        <div className="bg-card rounded-xl border border-border p-3 mb-4 flex items-center gap-3">
          <Flame className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('peak_hours')}: 12–2 PM & 7–9 PM</p>
            <p className="text-xs text-muted-foreground">
              {(new Date().getHours() >= 12 && new Date().getHours() <= 14) ||
               (new Date().getHours() >= 19 && new Date().getHours() <= 21)
                ? t('high_demand') : t('wait_peak')}
            </p>
          </div>
        </div>
      )}

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="mb-5">
          <h2 className="font-display font-semibold text-base mb-3">{t('active_delivery')}</h2>

          {myLat && myLng && (
            <RiderMapView
              myLat={myLat} myLng={myLng}
              shopLat={activeDelivery.shop_lat} shopLng={activeDelivery.shop_lng}
              customerLat={activeDelivery.delivery_lat} customerLng={activeDelivery.delivery_lng}
              shopName={activeDelivery.shops?.shop_name}
            />
          )}

          <div className="bg-card rounded-xl border-2 border-primary/30 p-4">
            <p className="font-semibold text-sm">🏪 {activeDelivery.shops?.shop_name || 'Shop'}</p>
            <p className="text-xs text-muted-foreground mt-1">📍 {t('pick_up_from')}: {activeDelivery.shops?.address || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">🏠 {t('deliver_to')}: {activeDelivery.delivery_address}</p>

            {activeDelivery.customer_note && (
              <div className="bg-warning/10 rounded-lg p-2 mt-2 border border-warning/20">
                <p className="text-xs font-bold text-warning">📝 {t('customer_note')}</p>
                <p className="text-sm">{activeDelivery.customer_note}</p>
              </div>
            )}

            {activeDelivery.customer_id && (
              <button onClick={() => setShowChat(true)} className="mt-2 flex items-center gap-2 text-primary text-sm font-semibold min-h-[36px]">
                <MessageCircle className="w-4 h-4" /> {t('chat_with_customer')}
              </button>
            )}

            <p className="text-[10px] font-bold uppercase mt-2 text-primary">
              Status: {activeDelivery.status?.replace('_', ' ')}
            </p>

            {activeDelivery.status === 'picked_up' && (
              <div className="mt-3">
                <label className="text-xs font-medium mb-1 block">{t('delivery_photo_required')}</label>
                <label className="flex-1 bg-muted rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">{deliveryPhoto ? t('change_photo') : t('take_upload_photo')}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setDeliveryPhoto(f); setDeliveryPhotoPreview(URL.createObjectURL(f)); }
                  }} />
                </label>
                {deliveryPhotoPreview && (
                  <img src={deliveryPhotoPreview} alt="Proof" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {activeDelivery.status === 'confirmed' && (
                <button
                  onClick={() => updateDeliveryStatus('picked_up')}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]"
                >
                  {t('mark_picked_up')}
                </button>
              )}
              {activeDelivery.status === 'picked_up' && (
                <button
                  onClick={() => updateDeliveryStatus('delivered')}
                  disabled={delivering}
                  className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px] disabled:opacity-50"
                >
                  {delivering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('mark_delivered')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Orders */}
      {isOnline && !activeDelivery && (
        <div>
          <h2 className="font-display font-semibold text-base mb-3">{t('available_orders')}</h2>
          {availableOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('no_orders_available')}</p>
          ) : (
            <div className="space-y-3">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-semibold text-sm">🏪 {order.shops?.shop_name || 'Shop'}</p>
                  <p className="text-xs text-muted-foreground mt-1">📍 {order.delivery_address}</p>
                  <p className="text-xs text-muted-foreground">{order.order_items?.length || 0} {t('items')}</p>
                  {order.customer_note && (
                    <p className="text-xs text-warning mt-1">📝 {order.customer_note}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-bold text-accent">Rs {order.delivery_fee} {t('fee')}</span>
                    <button
                      onClick={() => acceptOrder(order.id)}
                      disabled={accepting === order.id}
                      className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-semibold text-sm min-h-[44px] disabled:opacity-50"
                    >
                      {accepting === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t('accept')}
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
