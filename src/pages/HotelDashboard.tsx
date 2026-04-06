import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Package, ChevronRight, Loader2, Plus, Clock, X, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const HotelDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { t } = useLanguage();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [menuCount, setMenuCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      const { data: hotelData } = await (supabase as any).from('hotel_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!hotelData) { navigate('/hotel/setup', { replace: true }); return; }
      setHotel(hotelData);

      const [ordersRes, menuRes] = await Promise.all([
        (supabase as any).from('orders').select('id, status, total_amount, created_at').eq('hotel_id', hotelData.id),
        (supabase as any).from('menu_items').select('id').eq('hotel_id', hotelData.id),
      ]);
      const orders = ordersRes.data || [];
      setPendingCount(orders.filter((o: any) => o.status === 'placed').length);
      const today = new Date().toDateString();
      setTodayEarnings(orders.filter((o: any) => o.status === 'delivered' && new Date(o.created_at).toDateString() === today).reduce((s: number, o: any) => s + Number(o.total_amount), 0));
      setMenuCount(menuRes.data?.length || 0);
      setLoading(false);
    };
    init();

    const channel = supabase.channel('hotel-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
        if (payload.new.hotel_id === hotel?.id) {
          setPendingCount(prev => prev + 1);
          toast('🔔 ' + t('new_food_order'));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, navigate]);

  const toggleOpenStatus = async () => {
    if (!hotel) return;
    setToggling(true);
    const newStatus = !hotel.is_open;
    await (supabase as any).from('hotel_profiles').update({ is_open: newStatus }).eq('id', hotel.id);
    setHotel({ ...hotel, is_open: newStatus });
    toast.success(newStatus ? t('hotel_is_open') : t('hotel_is_closed'));
    setToggling(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {hotel?.logo_url ? (
            <img src={hotel.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-lg">🍽️</span></div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold">{hotel?.hotel_name}</h1>
            <p className="text-sm text-muted-foreground">{t('hotel_dashboard')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Open/Close Toggle */}
      <button onClick={toggleOpenStatus} disabled={toggling} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between mb-3 min-h-[56px]">
        <span className="font-display font-semibold">{t('hotel_status')}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${hotel?.is_open ? 'text-accent' : 'text-destructive'}`}>{hotel?.is_open ? t('open') : t('closed')}</span>
          {hotel?.is_open ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {Math.round(todayEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">{t('todays_earnings')}</p>
        </div>
        <div className="bg-orange-light rounded-xl p-3 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">{t('pending_orders')}</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <span className="text-xl">🍽️</span>
          <p className="font-display font-bold text-lg">{menuCount}</p>
          <p className="text-[10px] text-muted-foreground">{t('menu_items_label')}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <button onClick={() => navigate('/hotel/orders')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">{t('incoming_orders')}</span>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
        <button onClick={() => navigate('/hotel/menu')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">{t('manage_menu')}</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate('/hotel/menu', { state: { openAdd: true } })} className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 min-h-[52px] font-display font-semibold active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          {t('add_dish')}
        </button>
      </div>
    </div>
  );
};

export default HotelDashboard;
