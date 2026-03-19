import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FarmerFoodCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { t } = useLanguage();
  const state = location.state as any;
  const { hotelId, hotelName, cart = [], cartTotal = 0 } = state || {};

  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [fee, setFee] = useState(80);
  const [urgent, setUrgent] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    (supabase as any).from('farmer_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }: any) => { setFarmerProfile(data); setLoading(false); });
  }, [session]);

  if (!state || !hotelId) { navigate(-1); return null; }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handlePlaceOrder = async () => {
    if (!session?.user) return;
    setPlacing(true);
    try {
      const itemsDesc = cart.map((c: any) => `${c.menuItem.name} x${c.quantity}`).join(', ');
      const { data: order, error } = await (supabase as any).from('orders').insert({
        customer_id: session.user.id,
        shop_id: session.user.id, // placeholder
        hotel_id: hotelId,
        order_type: 'farm_food_order',
        items_description: itemsDesc,
        total_amount: cartTotal,
        farmer_offered_fee: fee,
        delivery_fee: fee,
        delivery_address: farmerProfile?.farm_landmark || 'Farm Location',
        delivery_lat: farmerProfile?.farm_lat,
        delivery_lng: farmerProfile?.farm_lng,
        urgent,
        status: 'placed',
      }).select().single();
      if (error) throw error;
      toast.success(t('success'));
      navigate('/order-tracking', { state: { orderId: order.id } });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">{t('checkout')}</h1>
      </div>

      {/* Order summary */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <p className="font-semibold text-sm mb-2">🍽️ {hotelName}</p>
        {cart.map((c: any, i: number) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span>{c.menuItem.name} x{c.quantity}</span>
            <span className="font-semibold">Rs {c.menuItem.price * c.quantity}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between font-display font-bold">
          <span>{t('subtotal')}</span>
          <span>Rs {cartTotal}</span>
        </div>
      </div>

      {/* Delivery Location */}
      <div className="bg-accent/10 rounded-xl border border-accent/20 p-4 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-accent" />
        <div>
          <p className="text-sm font-semibold">{t('delivering_to_farm')}</p>
          {farmerProfile?.farm_landmark && <p className="text-xs text-muted-foreground">📍 {farmerProfile.farm_landmark}</p>}
        </div>
      </div>

      {/* Delivery Fee */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">{t('set_delivery_fee')}</label>
        <div className="flex gap-2 mb-3">
          {[50, 80, 100, 150].map(f => (
            <button key={f} onClick={() => setFee(f)}
              className={`flex-1 rounded-xl border-2 p-3 text-center font-display font-bold text-sm min-h-[48px] ${fee === f ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}>
              Rs {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">PKR</span>
          <Input type="number" value={fee} onChange={e => setFee(Number(e.target.value))} className="h-12 ps-12 rounded-xl text-lg font-bold text-center" />
        </div>
      </div>

      {/* Urgent */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-sm">{t('mark_urgent')} 🚨</p>
            <p className="text-xs text-muted-foreground">{t('urgent_desc')}</p>
          </div>
        </div>
        <Switch checked={urgent} onCheckedChange={setUrgent} />
      </div>

      {/* Total + Place */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('subtotal')}</span><span>Rs {cartTotal}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('delivery_fee')}</span><span>Rs {fee}</span></div>
        <div className="border-t border-border pt-2 mt-2 flex justify-between font-display font-bold">
          <span>{t('total')}</span><span className="text-lg">Rs {cartTotal + fee}</span>
        </div>
      </div>

      <Button onClick={handlePlaceOrder} disabled={placing} className="w-full h-14 text-base font-display font-semibold rounded-xl mb-6">
        {placing ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : null}
        {t('place_order')} 🍽️
      </Button>
    </div>
  );
};

export default FarmerFoodCheckout;
