import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Locate, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, total, shopId } = useCart();
  const { user, session } = useAuth();
  const [address, setAddress] = useState(user?.address || '');
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

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      setAddress(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      toast.success('Location detected!');
    } catch {
      toast.error('Please enable location access or enter address manually');
    } finally {
      setLocating(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !session?.user) return;
    setPlacing(true);
    try {
      const { data: order, error: orderErr } = await (supabase as any).from('orders').insert({
        customer_id: session.user.id,
        shop_id: shopId,
        status: 'placed',
        total_amount: Math.round(total),
        delivery_fee: deliveryFee,
        delivery_address: address.trim(),
        payment_method: 'cash_on_delivery',
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
      toast.success('Order placed successfully!');
      navigate('/order-tracking', { state: { orderId: order.id } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground text-center mb-6">Add items from a shop to get started</p>
        <Button onClick={() => navigate('/home')} className="h-12 rounded-xl font-display">Browse Shops</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-bold">Your Cart</h1>
        </div>

        {shopName && <p className="text-sm text-muted-foreground mb-4">From {shopName}</p>}

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
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeItem(item.product.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-destructive ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Address */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-1.5 block">Delivery Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Enter your full address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="h-14 pl-10 pr-12 rounded-xl text-base"
            />
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={locating}
            className="mt-2 flex items-center gap-2 text-sm text-primary font-medium min-h-[40px] active:scale-95 transition-transform"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
            {locating ? 'Detecting location...' : 'Use My Current Location'}
          </button>
        </div>

        {/* Price Breakdown */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">Rs {Math.round(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="font-semibold">Rs {deliveryFee}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-display font-bold">Total</span>
            <span className="font-display font-bold text-lg">Rs {Math.round(total)}</span>
          </div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          disabled={!address.trim() || placing}
          className="w-full h-14 text-base font-display font-semibold rounded-xl mb-6"
        >
          {placing ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Placing Order...</> : 'Place Order (Cash on Delivery)'}
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
