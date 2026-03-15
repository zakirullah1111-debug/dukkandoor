import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Store } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { mockShops, mockProducts } from '@/data/mockData';

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { totalItems, total } = useCart();

  const shop = mockShops.find(s => s.id === shopId);
  const products = mockProducts.filter(p => p.shop_id === shopId);

  // Group by category
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof products>);

  if (!shop) return <div className="p-6 text-center">Shop not found</div>;

  return (
    <MobileLayout showNav={false}>
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-2xl">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-primary-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-3 mt-2">
          <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-primary-foreground">
            <h1 className="font-display text-xl font-bold">{shop.shop_name}</h1>
            <p className="text-sm opacity-80">{shop.category}</p>
            <div className="flex items-center gap-3 mt-1">
              {shop.rating && (
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
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                shop.is_open ? 'bg-accent/20 text-accent-foreground' : 'bg-primary-foreground/20'
              }`}>
                {shop.is_open ? '● Open' : '● Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 mt-4 pb-24 space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-display font-semibold text-base mb-2">{category}</h2>
            <div className="space-y-2">
              {items.map(p => <ProductCard key={p.id} product={p} shopId={shop.id} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Cart Bar */}
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
