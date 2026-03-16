import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Store, Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Shop, Product } from '@/types';

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { totalItems, total } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [shopRes, prodRes] = await Promise.all([
        (supabase as any).from('shops').select('*').eq('id', shopId).single(),
        (supabase as any).from('products').select('*').eq('shop_id', shopId).eq('in_stock', true),
      ]);
      if (shopRes.data) setShop(shopRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    };
    fetch();
  }, [shopId]);

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );

  if (!shop) return <div className="p-6 text-center">Shop not found</div>;

  return (
    <MobileLayout showNav={false}>
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-2xl">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-primary-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-3 mt-2">
          <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div className="text-primary-foreground">
            <h1 className="font-display text-xl font-bold">{shop.shop_name}</h1>
            <p className="text-sm opacity-80">{shop.category}</p>
            <div className="flex items-center gap-3 mt-1">
              {shop.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-semibold">{shop.rating}</span>
                </div>
              )}
              {shop.delivery_time && (
                <div className="flex items-center gap-1 opacity-80">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm">{shop.delivery_time}</span>
                </div>
              )}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${shop.is_open ? 'bg-accent/20 text-accent-foreground' : 'bg-primary-foreground/20'}`}>
                {shop.is_open ? '● Open' : '● Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-24 space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-display font-semibold text-base mb-2">{category}</h2>
            <div className="space-y-2">
              {items.map(p => <ProductCard key={p.id} product={p} shopId={shop.id} />)}
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products available</p>}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between min-h-[56px] active:scale-[0.98] transition-transform shadow-lg"
            >
              <span className="font-display font-semibold">{totalItems} items</span>
              <span className="font-display font-bold text-lg">View Cart • Rs {Math.round(total)}</span>
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default ShopPage;
