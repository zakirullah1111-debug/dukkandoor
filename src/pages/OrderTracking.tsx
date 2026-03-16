import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Package, CheckCircle2, Truck, MapPin, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      }
      setLoading(false);
    };
    fetchOrder();

    // Realtime subscription
    const channel = supabase.channel(`order-track-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        async (payload: any) => {
          const updated = payload.new;
          setOrder((prev: any) => prev ? { ...prev, ...updated } : updated);
          if (updated.status === 'delivered') {
            toast.success('Your order has been delivered! 🎉');
            setShowRating(true);
          } else if (updated.status === 'confirmed') {
            toast.success('Your order has been confirmed by the shop!');
          } else if (updated.status === 'picked_up') {
            toast.success('Rider has picked up your order!');
          } else if (updated.status === 'cancelled') {
            toast.error('Your order has been cancelled');
          }
          if (updated.rider_id && !rider) {
            const { data: rp } = await (supabase as any).from('profiles').select('*').eq('id', updated.rider_id).single();
            if (rp) setRider(rp);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

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
      });
      toast.success('Thank you for your rating!');
      setShowRating(false);
      setHasRated(true);
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
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

      {rider && (
        <div className="bg-card rounded-xl border border-border p-4 mb-5">
          <p className="text-xs text-muted-foreground mb-2">Your Rider</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-semibold">{rider.name}</p>
              <p className="text-sm text-muted-foreground">{rider.phone}</p>
            </div>
            <a href={`tel:${rider.phone}`} className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </a>
          </div>
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
            placeholder="Add a comment (optional)"
            value={ratingComment}
            onChange={e => setRatingComment(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm mb-3"
          />
          <Button onClick={submitRating} disabled={rating === 0 || submittingRating} className="w-full h-12 rounded-xl font-display">
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      )}

      <Button onClick={() => navigate('/home')} variant="outline" className="w-full h-12 rounded-xl font-display">
        Back to Home
      </Button>
    </div>
  );
};

export default OrderTracking;
