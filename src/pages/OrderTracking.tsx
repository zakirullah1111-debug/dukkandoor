import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Package, CheckCircle2, Truck, MapPin, Star, Loader2, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import RiderSelectionModal from '@/components/RiderSelectionModal';
import ChatWindow from '@/components/ChatWindow';
import LiveMapTracking from '@/components/LiveMapTracking';

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { t } = useLanguage();
  const orderId = (location.state as any)?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [rider, setRider] = useState<any>(null);
  const [shopOwner, setShopOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showRiderSelection, setShowRiderSelection] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const cancelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Chat
  const [chatTarget, setChatTarget] = useState<'rider' | 'shop' | null>(null);

  const steps = [
    { key: 'placed', label: t('order_placed'), icon: Package },
    { key: 'confirmed', label: t('order_confirmed'), icon: CheckCircle2 },
    { key: 'picked_up', label: t('picked_up'), icon: Truck },
    { key: 'delivered', label: t('order_delivered'), icon: MapPin },
  ];

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const fetchOrder = async () => {
      const { data } = await (supabase as any).from('orders')
        .select('*, order_items(*, products(*)), shops(shop_name, owner_id, address)')
        .eq('id', orderId).single();
      if (data) {
        setOrder(data);
        if (data.rider_id) {
          const { data: riderProfile } = await (supabase as any).from('profiles').select('*').eq('id', data.rider_id).single();
          if (riderProfile) setRider(riderProfile);
        }
        if (data.shops?.owner_id) {
          const { data: ownerProfile } = await (supabase as any).from('profiles').select('*').eq('id', data.shops.owner_id).single();
          if (ownerProfile) setShopOwner(ownerProfile);
        }
        if (data.status === 'delivered') {
          const { data: existingRating } = await (supabase as any).from('ratings').select('id').eq('order_id', orderId).maybeSingle();
          if (existingRating) setHasRated(true);
          else setShowRating(true);
        }
        if (data.status === 'confirmed' && !data.rider_id) setShowRiderSelection(true);
        if (data.status === 'placed') {
          const placed = new Date(data.created_at).getTime();
          const remaining = Math.max(0, 120 - Math.floor((Date.now() - placed) / 1000));
          if (remaining > 0) setCancelCountdown(remaining);
        }
      }
      setLoading(false);
    };
    fetchOrder();

    const channel = supabase.channel(`order-track-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        async (payload: any) => {
          const updated = payload.new;
          setOrder((prev: any) => prev ? { ...prev, ...updated } : updated);
          if (updated.status === 'delivered') { toast.success(t('delivery_completed')); setShowRating(true); setCancelCountdown(null); }
          else if (updated.status === 'confirmed') { toast.success(t('order_confirmed')); if (!updated.rider_id) setShowRiderSelection(true); }
          else if (updated.status === 'picked_up') { toast.success(t('picked_up')); setShowRiderSelection(false); }
          else if (updated.status === 'cancelled') { toast.error(t('order_cancelled')); setCancelCountdown(null); }
          if (updated.rider_id && !rider) {
            const { data: rp } = await (supabase as any).from('profiles').select('*').eq('id', updated.rider_id).single();
            if (rp) setRider(rp);
            setShowRiderSelection(false);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); if (cancelTimerRef.current) clearInterval(cancelTimerRef.current); };
  }, [orderId]);

  useEffect(() => {
    if (cancelCountdown === null || cancelCountdown <= 0) return;
    cancelTimerRef.current = setInterval(() => {
      setCancelCountdown(prev => {
        if (prev === null || prev <= 1) { if (cancelTimerRef.current) clearInterval(cancelTimerRef.current); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (cancelTimerRef.current) clearInterval(cancelTimerRef.current); };
  }, [cancelCountdown !== null]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      toast.success(t('order_cancelled'));
      setCancelCountdown(null);
    } catch { toast.error(t('error_retry')); }
    finally { setCancelling(false); }
  };

  const submitRating = async () => {
    if (rating === 0 || !order?.rider_id || !session?.user) return;
    setSubmittingRating(true);
    try {
      await (supabase as any).from('ratings').insert({
        order_id: orderId, rated_by: session.user.id, rider_id: order.rider_id,
        rating, comment: ratingComment, review_text: ratingComment,
      });
      toast.success(t('success'));
      setShowRating(false);
      setHasRated(true);
    } catch { toast.error(t('error_retry')); }
    finally { setSubmittingRating(false); }
  };

  const isActive = order && order.status !== 'delivered' && order.status !== 'cancelled';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6">
      <p className="text-muted-foreground mb-4">{t('order_not_found')}</p>
      <Button onClick={() => navigate('/home')}>{t('back_to_home')}</Button>
    </div>
  );

  const statusIndex = steps.findIndex(s => s.key === order.status);

  // Chat window overlay
  if (chatTarget) {
    const isRiderChat = chatTarget === 'rider';
    const receiverId = isRiderChat ? order.rider_id : order.shops?.owner_id;
    const receiverName = isRiderChat ? (rider?.name || 'Rider') : (order.shops?.shop_name || 'Shop');
    const receiverRole = isRiderChat ? 'Rider' : 'Shop';
    if (receiverId) {
      return <ChatWindow orderId={orderId} receiverId={receiverId} receiverName={receiverName} receiverRole={receiverRole} orderStatus={order.status} onClose={() => setChatTarget(null)} />;
    }
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">{t('order_tracking')}</h1>
      </div>

      {order.status === 'cancelled' ? (
        <div className="bg-destructive/10 rounded-xl p-6 text-center mb-5">
          <p className="text-destructive font-display font-bold text-lg">{t('order_cancelled')}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-5 mb-5">
          <div className="space-y-4">
            {steps.map((step, i) => {
              const done = i <= statusIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`font-semibold text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Map — only when picked_up */}
      {order.status === 'picked_up' && order.rider_id && (
        <LiveMapTracking
          riderId={order.rider_id}
          riderName={rider?.name || 'Rider'}
          shopLat={order.shop_lat}
          shopLng={order.shop_lng}
          deliveryLat={order.delivery_lat}
          deliveryLng={order.delivery_lng}
        />
      )}

      {/* Cancel window */}
      {order.status === 'placed' && cancelCountdown !== null && cancelCountdown > 0 && (
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4 mb-5">
          <p className="text-sm text-muted-foreground mb-2">
            {t('cancel_within')} <span className="font-bold text-destructive">{Math.floor(cancelCountdown / 60)}:{String(cancelCountdown % 60).padStart(2, '0')}</span>
          </p>
          <Button onClick={handleCancel} disabled={cancelling} variant="destructive" className="w-full h-10 rounded-xl text-sm">
            {cancelling ? t('loading') : t('cancel_order')}
          </Button>
        </div>
      )}
      {order.status === 'placed' && cancelCountdown === null && (
        <p className="text-xs text-muted-foreground text-center mb-5">{t('order_no_cancel')}</p>
      )}
      {order.status === 'confirmed' && cancelCountdown !== null && cancelCountdown > 0 && (
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-4 mb-5">
          <p className="text-sm text-muted-foreground mb-2">{t('shopkeeper_preparing')}</p>
          <Button onClick={handleCancel} disabled={cancelling} variant="destructive" size="sm" className="rounded-xl">
            {cancelling ? t('loading') : t('cancel_anyway')}
          </Button>
        </div>
      )}

      {order.customer_note && (
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-3 mb-5">
          <p className="text-xs font-bold text-warning mb-1">{t('your_note')}</p>
          <p className="text-sm">{order.customer_note}</p>
        </div>
      )}

      {/* Chat Buttons */}
      {isActive && (
        <div className="flex gap-2 mb-5">
          {order.shops?.owner_id && (
            <button onClick={() => setChatTarget('shop')} className="flex-1 bg-card rounded-xl border border-border p-3 flex items-center justify-center gap-2 text-sm font-semibold min-h-[44px]">
              <MessageCircle className="w-4 h-4" /> {t('chat_with_shop')}
            </button>
          )}
          {order.rider_id && (
            <button onClick={() => setChatTarget('rider')} className="flex-1 bg-card rounded-xl border border-border p-3 flex items-center justify-center gap-2 text-sm font-semibold min-h-[44px]">
              <MessageCircle className="w-4 h-4" /> {t('chat_with_rider')}
            </button>
          )}
        </div>
      )}

      {rider && (
        <button onClick={() => navigate(`/rider/${rider.id}`)} className="w-full bg-card rounded-xl border border-border p-4 mb-5 text-start">
          <p className="text-xs text-muted-foreground mb-2">{t('your_rider')}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-semibold">{rider.name}</p>
              <p className="text-sm text-muted-foreground">{rider.phone}</p>
            </div>
            <a href={`tel:${rider.phone}`} onClick={e => e.stopPropagation()} className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </button>
      )}

      {order.delivery_photo_url && order.delivery_photo_url !== '' && (
        <div className="bg-card rounded-xl border border-border p-4 mb-5">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> {t('delivery_photo')}</p>
          <img src={order.delivery_photo_url} alt="Delivery proof" className="w-full rounded-lg" />
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-4 mb-5">
        <p className="text-xs text-muted-foreground mb-2">{t('order_summary')}</p>
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between py-1.5">
            <span className="text-sm">{item.products?.name || 'Product'} × {item.quantity}</span>
            <span className="text-sm font-semibold">Rs {Math.round(item.price_at_order * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between">
          <span className="font-display font-bold">{t('total')}</span>
          <span className="font-display font-bold">Rs {Math.round(order.total_amount)}</span>
        </div>
      </div>

      {showRating && !hasRated && order.rider_id && (
        <div className="bg-card rounded-xl border-2 border-primary/20 p-5 mb-5">
          <p className="font-display font-semibold text-center mb-3">{t('rate_delivery')}</p>
          <div className="flex justify-center gap-2 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 ${s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <input type="text" placeholder={t('reviews')} value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border text-sm mb-3" />
          <Button onClick={submitRating} disabled={rating === 0 || submittingRating} className="w-full h-12 rounded-xl font-display">
            {submittingRating ? t('loading') : t('submit_rating')}
          </Button>
        </div>
      )}

      <Dialog open={showRiderSelection} onOpenChange={setShowRiderSelection}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <RiderSelectionModal orderId={orderId} onComplete={() => setShowRiderSelection(false)} />
        </DialogContent>
      </Dialog>

      <Button onClick={() => navigate('/home')} variant="outline" className="w-full h-12 rounded-xl font-display">
        {t('back_to_home')}
      </Button>
    </div>
  );
};

export default OrderTracking;
