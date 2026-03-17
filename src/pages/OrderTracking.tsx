import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Package, CheckCircle2, Truck, MapPin, Star, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import RiderSelectionModal from '@/components/RiderSelectionModal';

const steps = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const orderId = (location.state as any)?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showRiderSelection, setShowRiderSelection] = useState(false);
  // Cancellation
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const cancelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const fetchOrder = async () => {
      const { data } = await (supabase as any).from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', orderId).single();
      if (data) {
        setOrder(data);
        if (data.rider_id) {
          const { data: riderProfile } = await (supabase as any).from('profiles').select('*').eq('id', data.rider_id).single();
          if (riderProfile) setRider(riderProfile);
        }
        if (data.status === 'delivered') {
          const { data: existingRating } = await (supabase as any).from('ratings').select('id').eq('order_id', orderId).maybeSingle();
          if (existingRating) setHasRated(true);
          else setShowRating(true);
        }
        if (data.status === 'confirmed' && !data.rider_id) {
          setShowRiderSelection(true);
        }
        // Cancellation window (2 minutes)
        if (data.status === 'placed') {
          const placed = new Date(data.created_at).getTime();
          const remaining = Math.max(0, 120 - Math.floor((Date.now() - placed) / 1000));
          if (remaining > 0) {
            setCancelCountdown(remaining);
          }
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
          if (updated.status === 'delivered') {
            toast.success('Your order has been delivered! 🎉');
            setShowRating(true);
            setCancelCountdown(null);
          } else if (updated.status === 'confirmed') {
            toast.success('Your order has been confirmed by the shop!');
            if (!updated.rider_id) setShowRiderSelection(true);
          } else if (updated.status === 'picked_up') {
            toast.success('Rider has picked up your order!');
            setShowRiderSelection(false);
          } else if (updated.status === 'cancelled') {
            toast.error('Your order has been cancelled');
            setCancelCountdown(null);
          }
          if (updated.rider_id && !rider) {
            const { data: rp } = await (supabase as any).from('profiles').select('*').eq('id', updated.rider_id).single();
            if (rp) setRider(rp);
            setShowRiderSelection(false);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); if (cancelTimerRef.current) clearInterval(cancelTimerRef.current); };
  }, [orderId]);

  // Cancel countdown timer
  useEffect(() => {
    if (cancelCountdown === null || cancelCountdown <= 0) return;
    cancelTimerRef.current = setInterval(() => {
      setCancelCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
          return null;
        }
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
      toast.success('Order cancelled');
      setCancelCountdown(null);
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelling(false); }
  };

  const submitRating = async () => {
    if (rating === 0 || !order?.rider_id || !session?.user) return;
    setSubmittingRating(true);
    try {
      await (supabase as any).from('ratings').insert({
        order_id: orderId,
        rated_by: session.user.id,
        rider_id: order.rider_id,
        rating,
        comment: ratingComment,
        review_text: ratingComment,
      });
      toast.success('Thank you for your rating!');
      setShowRating(false);
      setHasRated(true);
    } catch { toast.error('Failed to submit rating'); }
    finally { setSubmittingRating(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6">
      <p className="text-muted-foreground mb-4">Order not found</p>
      <Button onClick={() => navigate('/home')}>Go Home</Button>
    </div>
  );

  const statusIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Order Tracking</h1>
      </div>

      {order.status === 'cancelled' ? (
        <div className="bg-destructive/10 rounded-xl p-6 text-center mb-5">
          <p className="text-destructive font-display font-bold text-lg">Order Cancelled</p>
          <p className="text-sm text-muted-foreground mt-1">This order has been cancelled</p>
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

      {/* Cancellation Window */}
      {order.status === 'placed' && cancelCountdown !== null && cancelCountdown > 0 && (
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4 mb-5">
          <p className="text-sm text-muted-foreground mb-2">
            You can cancel within <span className="font-bold text-destructive">{Math.floor(cancelCountdown / 60)}:{String(cancelCountdown % 60).padStart(2, '0')}</span>
          </p>
          <Button onClick={handleCancel} disabled={cancelling} variant="destructive" className="w-full h-10 rounded-xl text-sm">
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </div>
      )}
      {order.status === 'placed' && cancelCountdown === null && (
        <p className="text-xs text-muted-foreground text-center mb-5">Order can no longer be cancelled</p>
      )}
      {order.status === 'confirmed' && cancelCountdown !== null && cancelCountdown > 0 && (
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-4 mb-5">
          <p className="text-sm text-muted-foreground mb-2">
            ⚠️ The shopkeeper has started preparing. Cancel anyway?
          </p>
          <Button onClick={handleCancel} disabled={cancelling} variant="destructive" size="sm" className="rounded-xl">
            {cancelling ? 'Cancelling...' : 'Cancel Anyway'}
          </Button>
        </div>
      )}

      {/* Customer note */}
      {order.customer_note && (
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-3 mb-5">
          <p className="text-xs font-bold text-warning mb-1">📝 Your Note</p>
          <p className="text-sm">{order.customer_note}</p>
        </div>
      )}

      {rider && (
        <button onClick={() => navigate(`/rider/${rider.id}`)} className="w-full bg-card rounded-xl border border-border p-4 mb-5 text-left">
          <p className="text-xs text-muted-foreground mb-2">Your Rider</p>
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

      {/* Delivery Photo */}
      {order.delivery_photo_url && (
        <div className="bg-card rounded-xl border border-border p-4 mb-5">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Delivery Photo</p>
          <img src={order.delivery_photo_url} alt="Delivery proof" className="w-full rounded-lg" />
        </div>
      )}

      {/* Order Items */}
      <div className="bg-card rounded-xl border border-border p-4 mb-5">
        <p className="text-xs text-muted-foreground mb-2">Order Summary</p>
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between py-1.5">
            <span className="text-sm">{item.products?.name || 'Product'} × {item.quantity}</span>
            <span className="text-sm font-semibold">Rs {Math.round(item.price_at_order * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between">
          <span className="font-display font-bold">Total</span>
          <span className="font-display font-bold">Rs {Math.round(order.total_amount)}</span>
        </div>
      </div>

      {/* Rating */}
      {showRating && !hasRated && order.rider_id && (
        <div className="bg-card rounded-xl border-2 border-primary/20 p-5 mb-5">
          <p className="font-display font-semibold text-center mb-3">Rate your delivery</p>
          <div className="flex justify-center gap-2 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 ${s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a review (optional)"
            value={ratingComment}
            onChange={e => setRatingComment(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm mb-3"
          />
          <Button onClick={submitRating} disabled={rating === 0 || submittingRating} className="w-full h-12 rounded-xl font-display">
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      )}

      {/* Rider Selection Modal */}
      <Dialog open={showRiderSelection} onOpenChange={setShowRiderSelection}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <RiderSelectionModal orderId={orderId} onComplete={() => setShowRiderSelection(false)} />
        </DialogContent>
      </Dialog>

      <Button onClick={() => navigate('/home')} variant="outline" className="w-full h-12 rounded-xl font-display">
        Back to Home
      </Button>
    </div>
  );
};

export default OrderTracking;
