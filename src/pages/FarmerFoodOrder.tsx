import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, MapPin, Star, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const foodCategories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Chai & Drinks'];

const FarmerFoodOrder = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [hotels, setHotels] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    (supabase as any).from('hotel_profiles').select('*')
      .then(({ data }: any) => { setHotels(data || []); setLoading(false); });
  }, []);

  const filtered = hotels.filter(h => {
    const matchSearch = !search || h.hotel_name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Check if hotel is open
  const isOpen = (hotel: any) => {
    if (!hotel.is_open) return false;
    if (!hotel.business_hours) return hotel.is_open;
    const bh = hotel.business_hours;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    const daySchedule = bh[dayKey];
    if (!daySchedule || !daySchedule.open) return false;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (daySchedule.openTime || '09:00').split(':').map(Number);
    const [closeH, closeM] = (daySchedule.closeTime || '21:00').split(':').map(Number);
    return currentMin >= openH * 60 + openM && currentMin <= closeH * 60 + closeM;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-6">
      <div className="bg-accent px-4 pt-4 pb-5 rounded-b-2xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2 text-accent-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-lg font-bold text-accent-foreground">🍽️ {t('order_food')}</h1>
        </div>

        <div className="bg-accent-foreground/10 rounded-xl p-2.5 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent-foreground" />
          <span className="text-sm text-accent-foreground font-medium">📍 {t('delivering_to_farm')}</span>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder={t('search_products')} value={search} onChange={e => setSearch(e.target.value)}
            className="h-12 ps-10 rounded-xl bg-card border-0 text-base" />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {foodCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] ${
                selectedCategory === cat ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('no_hotels_found')}</p>
        ) : (
          filtered.map(hotel => {
            const open = isOpen(hotel);
            return (
              <button key={hotel.id} onClick={() => navigate(`/hotel/${hotel.id}`, { state: { farmerMode: true } })}
                className={`w-full bg-card rounded-xl border border-border p-4 text-start active:scale-[0.98] transition-transform ${!open ? 'opacity-60' : ''}`}>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {hotel.logo_url ? <img src={hotel.logo_url} alt={hotel.hotel_name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base truncate">{hotel.hotel_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{hotel.hotel_type} • {hotel.village}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {hotel.rating > 0 && (
                        <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-primary text-primary" /><span className="text-xs font-semibold">{Number(hotel.rating).toFixed(1)}</span></div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /><span className="text-xs">{hotel.prep_time_minutes} min</span></div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${open ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                        {open ? t('open') : t('closed')}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FarmerFoodOrder;
