import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const menuCategories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks'];

interface CartItem { menuItem: any; quantity: number; }

const HotelPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { t } = useLanguage();
  const farmerMode = (location.state as any)?.farmerMode;
  const [hotel, setHotel] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [hotelRes, menuRes] = await Promise.all([
        (supabase as any).from('hotel_profiles').select('*').eq('id', hotelId).single(),
        (supabase as any).from('menu_items').select('*').eq('hotel_id', hotelId).order('category'),
      ]);
      if (hotelRes.data) setHotel(hotelRes.data);
      if (menuRes.data) setMenuItems(menuRes.data);
      setLoading(false);
    };
    fetch();
  }, [hotelId]);

  const isOpen = (() => {
    if (!hotel?.is_open) return false;
    if (!hotel?.business_hours) return hotel.is_open;
    const bh = hotel.business_hours;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    const ds = bh[dayKey];
    if (!ds || !ds.open) return false;
    const cm = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = (ds.openTime || '08:00').split(':').map(Number);
    const [ch, cmo] = (ds.closeTime || '22:00').split(':').map(Number);
    return cm >= oh * 60 + om && cm <= ch * 60 + cmo;
  })();

  const addToCart = (item: any) => {
    if (!isOpen || !item.is_available) return;
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.menuItem.id !== itemId)); return; }
    setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: qty } : c));
  };

  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    // Navigate to a food checkout page with cart data
    navigate('/farmer/food-checkout', {
      state: {
        hotelId: hotel.id,
        hotelName: hotel.hotel_name,
        cart,
        cartTotal,
        farmerMode,
      },
    });
  };

  const filtered = selectedCat === 'All' ? menuItems : menuItems.filter(i => i.category === selectedCat);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!hotel) return <div className="p-6 text-center">Not found</div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      {/* Hotel Header */}
      <div className="bg-accent px-4 pt-4 pb-6 rounded-b-2xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2 text-accent-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl bg-accent-foreground/10 flex items-center justify-center overflow-hidden">
            {hotel.logo_url ? <img src={hotel.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
          </div>
          <div className="text-accent-foreground">
            <h1 className="font-display text-xl font-bold">{hotel.hotel_name}</h1>
            <p className="text-sm opacity-80">{hotel.hotel_type} • {hotel.village}</p>
            <div className="flex items-center gap-3 mt-1">
              {hotel.rating > 0 && <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /><span className="text-sm font-semibold">{Number(hotel.rating).toFixed(1)}</span></div>}
              <div className="flex items-center gap-1 opacity-80"><Clock className="w-3.5 h-3.5" /><span className="text-sm">{hotel.prep_time_minutes} min</span></div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-accent-foreground/20' : 'bg-accent-foreground/10'}`}>
                {isOpen ? '● ' + t('open') : '● ' + t('closed')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="mx-4 mt-3 bg-destructive/10 rounded-xl border border-destructive/20 p-3 text-center">
          <p className="text-sm text-destructive font-semibold">{t('hotel_currently_closed')}</p>
        </div>
      )}

      {/* Category Tabs */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {menuCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCat === cat ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map(item => {
          const inCart = cart.find(c => c.menuItem.id === item.id);
          return (
            <div key={item.id} className={`bg-card rounded-xl border border-border p-3 flex gap-3 ${!item.is_available ? 'opacity-50' : ''}`}>
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  {!item.is_available && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full shrink-0">SOLD OUT</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-display font-bold text-sm">Rs {item.price}</span>
                  {item.is_available && isOpen && (
                    inCart ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-6 text-center font-bold text-sm">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold min-h-[32px]">
                        {t('add')} +
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_menu_items')}</p>}
      </div>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom">
          <div className="max-w-lg mx-auto">
            <button onClick={handleCheckout}
              className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between min-h-[56px] active:scale-[0.98] transition-transform shadow-lg">
              <span className="font-display font-semibold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {cartCount} {t('items')}</span>
              <span className="font-display font-bold text-lg">{t('view_cart')} • Rs {cartTotal}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelPage;
