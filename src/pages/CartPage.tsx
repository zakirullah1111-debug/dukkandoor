import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { mockShops } from '@/data/mockData';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, total, shopId } = useCart();
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const [address, setAddress] = useState(user?.address || '');
  const [placing, setPlacing] = useState(false);

  const shop = mockShops.find(s => s.id === shopId);

  const handlePlaceOrder = () => {
    if (!address.trim()) return;
    setPlacing(true);
    setTimeout(() => {
      const order = {
        id: `order-${Date.now()}`,
        customer_id: user?.id || '',
        shop_id: shopId || '',
        rider_id: null,
        status: 'placed' as const,
        total_amount: total,
        delivery_fee: deliveryFee,
        payment_method: 'cash_on_delivery' as const,
        delivery_address: address,
        created_at: new Date().toISOString(),
        shop,
        items: items.map(i => ({
          id: `oi-${Date.now()}-${i.product.id}`,
          order_id: '',
          product_id: i.product.id,
          quantity: i.quantity,
          price_at_order: i.product.price * (1 - i.product.discount_percent / 100),
          product: i.product,
        })),
      };
      addOrder(order);
      clearCart();
      setPlacing(false);
      navigate('/order-tracking', { state: { orderId: order.id } });
    }, 1000);
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

        {shop && (
          <p className="text-sm text-muted-foreground mb-4">From {shop.shop_name}</p>
        )}

        {/* Items */}
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
              className="h-14 pl-10 rounded-xl text-base"
            />
          </div>
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
          {placing ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
