import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Zap, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChatWindow from '@/components/ChatWindow';

const HotelOrders = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [hotel, setHotel] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOrder, setChatOrder] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      const { data: hotelData } = await (supabase as any).from('hotel_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!hotelData) return;
      setHotel(hotelData);
      const { data: ordersData } = await (supabase as any).from('orders').select('*, profiles:customer_id(name, phone)').eq('hotel_id', hotelData.id).order('created_at', { ascending: false });
      setOrders(ordersData || []);
      setLoading(false);
    };
    init();

    const channel = supabase.channel('hotel-order-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        init();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await (supabase as any).from('orders').update({ status }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(t('success'));
    } catch { toast.error(t('error_retry')); }
  };

  if (chatOrder) {
    return <ChatWindow orderId={chatOrder.id} receiverId={chatOrder.customer_id} receiverName={chatOrder.profiles?.name || 'Customer'} receiverRole="Customer" orderStatus={chatOrder.status} onClose={() => setChatOrder(null)} />;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const pending = orders.filter(o => o.status === 'placed');
  const active = orders.filter(o => ['confirmed', 'picked_up'].includes(o.status));
  const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-6">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-bold">{t('incoming_orders')}</h1>
        </div>

        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-semibold text-sm mb-3 text-destructive">{t('pending_orders')} ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map(order => (
                <div key={order.id} className="bg-card rounded-xl border-2 border-destructive/20 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">👤 {order.profiles?.name || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
                      {order.urgent && <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive mt-1"><Zap className="w-3 h-3" /> {t('urgent')}</span>}
                    </div>
                    <span className="font-display font-bold text-accent">Rs {order.farmer_offered_fee || order.total_amount}</span>
                  </div>
                  {order.customer_note && (
                    <div className="bg-warning/10 rounded-lg p-2 mt-2 border border-warning/20">
                      <p className="text-xs font-bold text-warning">📝 {t('customer_note')}</p>
                      <p className="text-sm">{order.customer_note}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex-1 bg-accent text-accent-foreground rounded-lg p-3 font-semibold text-sm min-h-[44px]">{t('accept')}</button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="flex-1 bg-destructive/10 text-destructive rounded-lg p-3 font-semibold text-sm min-h-[44px]">{t('cancel')}</button>
                  </div>
                  <button onClick={() => setChatOrder(order)} className="mt-2 flex items-center gap-2 text-primary text-sm font-semibold min-h-[36px]">
                    <MessageCircle className="w-4 h-4" /> {t('message_customer')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-semibold text-sm mb-3">{t('active_orders')} ({active.length})</h2>
            <div className="space-y-3">
              {active.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-semibold text-sm">👤 {order.profiles?.name || 'Customer'}</p>
                  <p className="text-xs text-accent font-bold mt-1">{order.status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-sm mb-3 text-muted-foreground">{t('past_orders')}</h2>
            <div className="space-y-2">
              {past.slice(0, 10).map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-3 opacity-70">
                  <div className="flex justify-between">
                    <span className="text-sm">{order.profiles?.name || 'Customer'}</span>
                    <span className={`text-xs font-bold ${order.status === 'delivered' ? 'text-accent' : 'text-destructive'}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_orders_yet')}</p>}
      </div>
    </div>
  );
};

export default HotelOrders;
