import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ShopCard from '@/components/ShopCard';
import { supabase } from '@/integrations/supabase/client';
import { Shop } from '@/types';

const farmCategories = [
  { name: 'All', icon: '🌾' },
  { name: 'Tools', icon: '🔧' },
  { name: 'Medicine', icon: '💊' },
  { name: 'Seeds', icon: '🌱' },
  { name: 'First Aid', icon: '🩹' },
  { name: 'General Store', icon: '🏪' },
];

const FarmerShopOrder = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const init = async () => {
      const [shopsRes, fpRes] = await Promise.all([
        (supabase as any).from('shops').select('*').eq('is_open', true),
        session?.user ? (supabase as any).from('farmer_profiles').select('*').eq('user_id', session.user.id).maybeSingle() : null,
      ]);
      setShops(shopsRes.data || []);
      if (fpRes?.data) setFarmerProfile(fpRes.data);
      setLoading(false);
    };
    init();
  }, [session]);

  const filtered = shops.filter(s => {
    const matchSearch = !search || s.shop_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-6">
      <div className="bg-primary px-4 pt-4 pb-5 rounded-b-2xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2 text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-lg font-bold text-primary-foreground">🏪 {t('order_from_shop')}</h1>
        </div>

        {/* Farm delivery banner */}
        <div className="bg-primary-foreground/10 rounded-xl p-2.5 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-foreground" />
          <span className="text-sm text-primary-foreground font-medium">📍 {t('delivering_to_farm')}</span>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder={t('search_products')} value={search} onChange={e => setSearch(e.target.value)}
            className="h-12 ps-10 rounded-xl bg-card border-0 text-base" />
        </div>
      </div>

      {/* Farm categories */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {farmCategories.map(cat => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] ${
                selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('no_shops_found')}</p>
        ) : (
          filtered.map(shop => (
            <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`, { state: { farmerMode: true, farmerProfile } })}>
              <ShopCard shop={shop} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FarmerShopOrder;
