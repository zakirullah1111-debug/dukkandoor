import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { t } = useLanguage();
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile'>('home');

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      const [fpRes, ordersRes] = await Promise.all([
        (supabase as any).from('farmer_profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
        (supabase as any).from('orders').select('*').eq('customer_id', session.user.id).order('created_at', { ascending: false }).limit(3),
      ]);
      if (!fpRes.data) { navigate('/farmer/setup', { replace: true }); return; }
      setFarmerProfile(fpRes.data);
      setRecentOrders(ordersRes.data || []);
      setLoading(false);
    };
    init();
  }, [session, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const statusColors: Record<string, string> = {
    placed: 'bg-warning/10 text-warning',
    confirmed: 'bg-primary/10 text-primary',
    picked_up: 'bg-accent/10 text-accent',
    delivered: 'bg-accent/10 text-accent',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const orderTypeLabels: Record<string, string> = {
    home_pickup: '🏠 ' + t('home_pickup'),
    farm_shop_order: '🏪 ' + t('shop_order'),
    farm_food_order: '🍽️ ' + t('food_order'),
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-20">
      {activeTab === 'home' && (
        <div className="px-4 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-display font-bold">DukkanDoor 🌾</p>
              <p className="text-base font-semibold mt-0.5">{t('greeting')} {user?.name}!</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-xs text-muted-foreground">{t('logout')}</button>
            </div>
          </div>

          {/* Farm location badge */}
          {farmerProfile?.farm_lat ? (
            <div className="bg-accent/10 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">📍 {t('farm_location_saved')} ✅</span>
            </div>
          ) : (
            <button onClick={() => setActiveTab('profile')} className="w-full bg-warning/10 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-warning">📍 {t('tap_save_farm_location')} ⚠️</span>
            </button>
          )}

          {/* 3 Action Cards */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => navigate('/farmer/home-pickup')}
              className="w-full bg-primary/10 rounded-2xl p-5 text-start active:scale-[0.98] transition-transform border-2 border-primary/20 min-h-[90px]"
            >
              <span className="text-3xl">🏠</span>
              <h3 className="font-display text-lg font-bold mt-2">{t('get_from_home')}</h3>
              <p className="text-sm text-muted-foreground">{t('get_from_home_desc')}</p>
            </button>

            <button
              onClick={() => navigate('/farmer/shop-order')}
              className="w-full bg-secondary/50 rounded-2xl p-5 text-start active:scale-[0.98] transition-transform border-2 border-secondary min-h-[90px]"
            >
              <span className="text-3xl">🏪</span>
              <h3 className="font-display text-lg font-bold mt-2">{t('order_from_shop')}</h3>
              <p className="text-sm text-muted-foreground">{t('order_from_shop_desc')}</p>
            </button>

            <button
              onClick={() => navigate('/farmer/food-order')}
              className="w-full bg-accent/10 rounded-2xl p-5 text-start active:scale-[0.98] transition-transform border-2 border-accent/20 min-h-[90px]"
            >
              <span className="text-3xl">🍽️</span>
              <h3 className="font-display text-lg font-bold mt-2">{t('order_food')}</h3>
              <p className="text-sm text-muted-foreground">{t('order_food_desc')}</p>
            </button>
          </div>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-base mb-3">{t('recent_orders')}</h3>
              <div className="space-y-2">
                {recentOrders.map(o => (
                  <button key={o.id} onClick={() => navigate('/order-tracking', { state: { orderId: o.id } })}
                    className="w-full bg-card rounded-xl border border-border p-3 text-start">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{orderTypeLabels[o.order_type] || '📦 Order'}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[o.status] || ''}`}>
                        {o.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Rs {o.total_amount || o.farmer_offered_fee || 0}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <FarmerOrders session={session} />
      )}

      {activeTab === 'profile' && (
        <FarmerProfileTab farmerProfile={farmerProfile} setFarmerProfile={setFarmerProfile} session={session} />
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {([
            { key: 'home' as const, icon: Home, label: t('home') },
            { key: 'orders' as const, icon: ClipboardList, label: t('orders') },
            { key: 'profile' as const, icon: User, label: t('profile') },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 min-w-[3rem] min-h-[2.75rem] ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`}>
              <tab.icon className="w-6 h-6" />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Farmer Orders Sub-Tab
const FarmerOrders = ({ session }: { session: any }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    (supabase as any).from('orders').select('*').eq('customer_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setOrders(data || []); setLoading(false); });
  }, [session]);

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 pt-4">
      <h1 className="font-display text-xl font-bold mb-4">{t('my_orders')}</h1>
      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t('no_orders_yet')}</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <button key={o.id} onClick={() => navigate('/order-tracking', { state: { orderId: o.id } })}
              className="w-full bg-card rounded-xl border border-border p-4 text-start">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">
                  {o.order_type === 'home_pickup' ? '🏠→🌾' : o.order_type === 'farm_food_order' ? '🍽️→🌾' : '🏪→🌾'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-accent/10 text-accent' : o.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  {o.status}
                </span>
              </div>
              {o.items_description && <p className="text-sm mt-1 truncate">{o.items_description}</p>}
              <p className="text-xs text-muted-foreground mt-1">Rs {o.farmer_offered_fee || o.total_amount || 0} • {new Date(o.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Farmer Profile Tab
const FarmerProfileTab = ({ farmerProfile, setFarmerProfile, session }: { farmerProfile: any; setFarmerProfile: any; session: any }) => {
  const { t } = useLanguage();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editingContacts, setEditingContacts] = useState(false);
  const [contacts, setContacts] = useState<any[]>(farmerProfile?.saved_contacts || []);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const updateFarmLocation = async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true });
      });
      await (supabase as any).from('farmer_profiles').update({
        farm_lat: pos.coords.latitude, farm_lng: pos.coords.longitude,
      }).eq('user_id', session.user.id);
      setFarmerProfile((p: any) => ({ ...p, farm_lat: pos.coords.latitude, farm_lng: pos.coords.longitude }));
      toast.success(t('success'));
    } catch { toast.error(t('error_retry')); }
    finally { setLocating(false); }
  };

  const saveContacts = async () => {
    setSaving(true);
    try {
      await (supabase as any).from('farmer_profiles').update({ saved_contacts: contacts }).eq('user_id', session.user.id);
      setFarmerProfile((p: any) => ({ ...p, saved_contacts: contacts }));
      setEditingContacts(false);
      toast.success(t('success'));
    } catch { toast.error(t('error_retry')); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="font-display text-xl font-bold mb-4">{t('profile')}</h1>
      
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <p className="font-semibold text-base">{user?.name}</p>
        <p className="text-sm text-muted-foreground">{user?.phone}</p>
        <p className="text-sm text-muted-foreground">{user?.village}</p>
      </div>

      {/* Farm Location */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <h3 className="font-semibold text-sm mb-2">{t('farm_location')}</h3>
        {farmerProfile?.farm_lat ? (
          <p className="text-sm text-accent mb-2">📍 {t('farm_location_saved')} ✅</p>
        ) : (
          <p className="text-sm text-warning mb-2">📍 {t('no_farm_location')}</p>
        )}
        {farmerProfile?.farm_landmark && (
          <p className="text-xs text-muted-foreground mb-2">{farmerProfile.farm_landmark}</p>
        )}
        <button onClick={updateFarmLocation} disabled={locating}
          className="text-sm text-primary font-semibold flex items-center gap-1 min-h-[36px]">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {t('update_farm_location')}
        </button>
      </div>

      {/* Saved Contacts */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm">{t('saved_contacts')}</h3>
          <button onClick={() => setEditingContacts(!editingContacts)} className="text-sm text-primary font-semibold">
            {editingContacts ? t('cancel') : t('edit')}
          </button>
        </div>
        {editingContacts ? (
          <div className="space-y-2">
            {contacts.map((c: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={c.label} onChange={e => { const n = [...contacts]; n[i] = { ...n[i], label: e.target.value }; setContacts(n); }} className="h-10 rounded-lg text-sm" placeholder={t('contact_label')} />
                <Input value={c.phone} onChange={e => { const n = [...contacts]; n[i] = { ...n[i], phone: e.target.value }; setContacts(n); }} className="h-10 rounded-lg text-sm" placeholder="03XX..." />
              </div>
            ))}
            {contacts.length < 5 && (
              <button onClick={() => setContacts([...contacts, { label: '', phone: '' }])} className="text-sm text-primary font-semibold">+ {t('add_contact')}</button>
            )}
            <Button onClick={saveContacts} disabled={saving} className="w-full h-10 rounded-xl text-sm">{saving ? t('loading') : t('save')}</Button>
          </div>
        ) : (
          <div className="space-y-1">
            {(farmerProfile?.saved_contacts || []).map((c: any, i: number) => (
              <p key={i} className="text-sm">{c.label}: {c.phone}</p>
            ))}
            {(!farmerProfile?.saved_contacts || farmerProfile.saved_contacts.length === 0) && (
              <p className="text-sm text-muted-foreground">{t('no_contacts_saved')}</p>
            )}
          </div>
        )}
      </div>

      <LanguageToggle />

      <button onClick={async () => { await logout(); navigate('/', { replace: true }); }}
        className="w-full mt-4 bg-destructive/10 text-destructive rounded-xl p-4 font-semibold text-sm min-h-[48px]">
        {t('logout')}
      </button>
    </div>
  );
};

export default FarmerDashboard;
