import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Locate, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, total, shopId } = useCart();
  const { user, session } = useAuth();
  const { t } = useLanguage();

  // FIX: read farmerMode and farmerProfile passed from ShopPage
  const farmerMode = (location.state as any)?.farmerMode || false;
  const farmerProfile = (location.state as any)?.farmerProfile || null;

  // FIX: for farmers, pre-fill address from farm landmark — fixes the disabled button bug
  const getDefaultAddress = () => {
    if (farmerMode && farmerProfile?.farm_landmark) return farmerProfile.farm_landmark;
    if (farmerMode && farmerProfile?.farm_lat) return `Farm Location (${farmerProfile.farm_lat.toFixed(4)}, ${farmerProfile.farm_lng.toFixed(4)})`;
    return user?.address || '';
  };

  const [address, setAddress] = useState(getDefaultAddress());
  const [customerNote, setCustomerNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    if (shopId) {
      (supabase as any).from('shops').select('shop_name').eq('id', shopId).single().then(({ data }: any) => {
        if (data) setShopName(data.shop_name);
      });
    }
  }, [shopId]);

  const geocodeAddress = async (addr: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {}
    return null;
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      setAddress(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      toast.success(t('success'));
    } catch { toast.error(t('error_retry')); }
    finally { setLocating(false); }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !session?.user) return;
    setPlacing(true);
    try {
      // FIX: for farmer orders, use saved farm coordinates directly — no geocoding needed
      let deliveryLat: number | null = null;
      let deliveryLng: number | null = null;

      if (farmerMode && farmerProfile?.farm_lat) {
        // Use exact farm GPS coordinates saved during farmer setup
        deliveryLat = farmerProfile.farm_lat;
        deliveryLng = farmerProfile.farm_lng;
      } else {
        const deliveryCoords = await geocodeAddress(address.trim());
        deliveryLat = deliveryCoords?.lat || null;
        deliveryLng = deliveryCoords?.lng || null;
      }

      // Get shop coordinates for map tracking
      const shopData = shopId
        ? await (supabase as any).from('shops').select('address').eq('id', shopId).single()
        : null;
      let shopCoords = null;
      if (shopData?.data?.address) {
        shopCoords = await geocodeAddress(shopData.data.address);
      }

      const { data: order, error: orderErr } = await (supabase as any).from('orders').insert({
        customer_id: session.user.id,
        shop_id: shopId,
        status: 'placed',
        total_amount: Math.round(total),
        delivery_fee: deliveryFee,
        delivery_address: address.trim(),
        payment_method: 'cash_on_delivery',
        customer_note: customerNote.trim(),
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        shop_lat: shopCoords?.lat || null,
        shop_lng: shopCoords?.lng || null,
        // FIX: set correct order_type so farmer's order history shows it correctly
        order_type: farmerMode ? 'farm_shop_order' : null,
      }).select().single();

      if (orderErr) throw orderErr;

      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        price_at_order: Math.round(i.product.price * (1 - i.product.discount_percent / 100)),
      }));
      const { error: itemsErr } = await (supabase as any).from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      toast.success(t('success'));
      navigate('/order-tracking', { state: { orderId: order.id } });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setPlacing(false); }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-xl font-bold mb-2">{t('cart_empty')}</h2>
        <p className="text-muted-foreground text-center mb-6">{t('cart_empty_desc')}</p>
        <Button
          onClick={() => navigate(farmerMode ? '/farmer/shop-order' : '/home')}
          className="h-12 rounded-xl font-display"
        >
          {t('browse_shops')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-bold">{t('your_cart')}</h1>
        </div>

        {/* FIX: show farm delivery banner for farmer orders */}
        {farmerMode && (
          <div className="bg-accent/10 rounded-xl border border-accent/20 p-3 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">🌾 Delivering to your farm</p>
              <p className="text-xs text-muted-foreground">
                {farmerProfile?.farm_lat
                  ? 'Using your saved farm GPS location'
                  : 'Please enter your farm address below'}
              </p>
            </div>
          </div>
        )}

        {shopName && <p className="text-sm text-muted-foreground mb-4">{t('from')} {shopName}</p>}

        <div className="space-y-3 mb-6">
          {items.map(item => {
            const discounted = item.product.price * (1 - item.product.discount_percent / 100);
            return (
              <div key={item.product.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.product.name}</p>
                  <p className="font-display font-bold text-sm mt-0.5">Rs {Math.round(discounted * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => removeItem(item.product.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-destructive ms-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1.5 block">
            {farmerMode ? '📍 Farm Delivery Address' : t('delivery_address')}
          </label>
          <div className="relative">
            <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={farmerMode ? 'Your farm location or landmark' : t('enter_address')}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="h-14 ps-10 pe-12 rounded-xl text-base"
            />
          </div>
          {/* FIX: for farmers with saved GPS, show a note that their farm location will be used */}
          {farmerMode && farmerProfile?.farm_lat ? (
            <p className="text-xs text-accent mt-1.5 flex items-center gap-1">
              ✅ Your saved farm GPS coordinates will be used for map tracking
            </p>
          ) : (
            <button onClick={getCurrentLocation} disabled={locating} className="mt-2 flex items-center gap-2 text-sm text-primary font-medium min-h-[40px] active:scale-95 transition-transform">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
              {locating ? t('detecting_location') : t('use_current_location')}
            </button>
          )}
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            {t('add_note_shop')}
          </label>
          <Textarea
            placeholder={t('note_placeholder')}
            value={customerNote}
            onChange={e => setCustomerNote(e.target.value)}
            className="rounded-xl text-sm"
            maxLength={500}
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('subtotal')}</span><span className="font-semibold">Rs {Math.round(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('delivery_fee')}</span><span className="font-semibold">Rs {deliveryFee}</span></div>
          <div className="border-t border-border pt-2 flex justify-between"><span className="font-display font-bold">{t('total')}</span><span className="font-display font-bold text-lg">Rs {Math.round(total)}</span></div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          disabled={!address.trim() || placing}
          className="w-full h-14 text-base font-display font-semibold rounded-xl mb-6"
        >
          {placing ? <><Loader2 className="w-5 h-5 animate-spin me-2" /> {t('placing_order')}</> : t('place_order_cod')}
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
