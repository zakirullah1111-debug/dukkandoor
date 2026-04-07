import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { shopCategories } from '@/data/mockData';
import ShopCard from '@/components/ShopCard';
import { supabase } from '@/integrations/supabase/client';
import { Shop } from '@/types';
import { Loader2 } from 'lucide-react';

const Categories = () => {
  const location = useLocation();
  const initialCat = (location.state as any)?.category || null;
  const [selected, setSelected] = useState<string | null>(initialCat);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = (supabase as any).from('shops').select('*');
      if (selected) query = query.eq('category', selected);
      const { data } = await query;
      if (data) setShops(data);
      setLoading(false);
    };
    setLoading(true);
    fetch();
  }, [selected]);

  return (
    <MobileLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold mb-4">Shops</h1>

        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setSelected(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${!selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}
          >
            All
          </button>
          {shopCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelected(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${selected === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
            {shops.length === 0 && <p className="text-center text-muted-foreground py-8">No shops in this category</p>}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Categories;
