import { useState } from 'react';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MobileLayout from '@/components/MobileLayout';
import ShopCard from '@/components/ShopCard';
import { useAuth } from '@/contexts/AuthContext';
import { mockShops, mockProducts, shopCategories } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredShops = search
    ? mockShops.filter(s => s.shop_name.toLowerCase().includes(search.toLowerCase()))
    : mockShops;

  const dealsProducts = mockProducts.filter(p => p.discount_percent > 0 && p.in_stock);

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-2xl">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary-foreground/80" />
          <span className="text-primary-foreground/80 text-sm">Delivering to</span>
          <span className="text-primary-foreground font-display font-semibold text-sm">{user?.village || 'Your Village'}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search shops & products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-12 pl-10 rounded-xl bg-card border-0 text-base"
          />
        </div>
      </div>

      <div className="px-4 mt-5 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
          <p className="text-sm font-medium opacity-90">Welcome to</p>
          <h2 className="font-display text-xl font-bold mt-0.5">DukkanDoor 🚪</h2>
          <p className="text-sm mt-1 opacity-80">Free delivery on your first order!</p>
        </div>

        {/* Categories */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Shop by Category</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {shopCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => navigate('/categories', { state: { category: cat.name } })}
                className="flex flex-col items-center gap-1.5 min-w-[4.5rem] shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-light flex items-center justify-center text-2xl">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nearby Shops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Nearby Shops</h2>
            <button className="text-primary text-sm font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {filteredShops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        </div>

        {/* Deals */}
        {dealsProducts.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-3">🔥 Deals & Discounts</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {dealsProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/shop/${product.shop_id}`)}
                  className="min-w-[10rem] shrink-0 bg-card rounded-xl border border-border p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-full h-20 rounded-lg bg-muted flex items-center justify-center mb-2 text-2xl">🛍️</div>
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-display font-bold text-sm">
                      Rs {Math.round(product.price * (1 - product.discount_percent / 100))}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">Rs {product.price}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full mt-1 inline-block">
                    {product.discount_percent}% OFF
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default CustomerHome;
