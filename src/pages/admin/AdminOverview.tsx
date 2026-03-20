import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Package, DollarSign, Bike, Users, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';

const COLORS = ['hsl(14,100%,63%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(220,70%,55%)', 'hsl(280,60%,55%)'];

const AdminOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [o, p, r, s, h] = await Promise.all([
        (supabase as any).from('orders').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('profiles').select('*'),
        (supabase as any).from('riders').select('*'),
        (supabase as any).from('shops').select('*'),
        (supabase as any).from('hotel_profiles').select('*'),
      ]);
      setOrders(o.data || []);
      setProfiles(p.data || []);
      setRiders(r.data || []);
      setShops(s.data || []);
      setHotels(h.data || []);
      setLoading(false);
    };
    fetch();

    // Realtime subscription for live updates
    const channel = supabase.channel('admin-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  const today = new Date();
  const todayOrders = orders.filter(o => isToday(new Date(o.created_at)));
  const yesterdayOrders = orders.filter(o => isYesterday(new Date(o.created_at)));
  const todayRevenue = todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.delivery_fee), 0);
  const todayCompleted = todayOrders.filter(o => o.status === 'delivered').length;
  const activeRiders = riders.filter(r => r.is_available).length;
  const pctChange = yesterdayOrders.length > 0 ? Math.round(((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100) : 0;

  const roleCounts = profiles.reduce((a: any, p: any) => { a[p.role] = (a[p.role] || 0) + 1; return a; }, {});

  // Charts data
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(today, 13 - i);
    const dayOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= startOfDay(day) && d <= endOfDay(day); });
    return {
      date: format(day, 'MMM dd'),
      completed: dayOrders.filter(o => o.status === 'delivered').length,
      cancelled: dayOrders.filter(o => o.status === 'cancelled').length,
      revenue: dayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.delivery_fee), 0),
    };
  });

  const ordersByType = [
    { name: 'Customer', value: orders.filter(o => o.order_type === 'shop_order').length },
    { name: 'Home Pickup', value: orders.filter(o => o.order_type === 'home_pickup').length },
    { name: 'Farm Shop', value: orders.filter(o => o.order_type === 'farm_shop_order').length },
    { name: 'Farm Food', value: orders.filter(o => o.order_type === 'farm_food_order').length },
  ].filter(x => x.value > 0);

  const topShops = [...shops, ...hotels.map(h => ({ shop_name: h.hotel_name, id: h.id }))]
    .map(s => ({ name: s.shop_name, count: orders.filter(o => o.shop_id === s.id || o.hotel_id === s.id).length }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: orders.filter(o => new Date(o.created_at).getHours() === h).length,
  }));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package} label="Orders Today" value={todayOrders.length}
          sub={pctChange >= 0 ? `↑ ${pctChange}% vs yesterday` : `↓ ${Math.abs(pctChange)}% vs yesterday`}
          color="bg-orange-50" iconColor="text-primary" onClick={() => navigate('/admin/orders')} />
        <StatCard icon={DollarSign} label="Revenue Today" value={`PKR ${todayRevenue.toLocaleString()}`}
          sub={`from ${todayCompleted} completed`} color="bg-green-50" iconColor="text-accent" />
        <StatCard icon={Bike} label="Active Riders" value={activeRiders}
          sub={`of ${riders.length} total`} color="bg-blue-50" iconColor="text-blue-600" dot />
        <StatCard icon={Users} label="Total Users" value={profiles.length}
          sub={`C:${roleCounts.customer || 0} F:${roleCounts.farmer || 0} R:${roleCounts.rider || 0}`}
          color="bg-purple-50" iconColor="text-purple-600" />
        <StatCard icon={AlertCircle} label="Pending" value={(0)}
          sub="Reports & villages" color="bg-red-50" iconColor="text-destructive"
          onClick={() => navigate('/admin/reports')} />
        <StatCard icon={BarChart3} label="All Time Orders" value={orders.length}
          sub="Since launch" color="bg-gray-50" iconColor="text-gray-600" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Orders Per Day (14 days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="hsl(142,71%,45%)" name="Completed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancelled" fill="hsl(0,84%,60%)" name="Cancelled" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Per Day (14 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(14,100%,63%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by Type">
          {ordersByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ordersByType} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {ordersByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No order data yet</p>}
        </ChartCard>

        <ChartCard title="Top 5 Shops/Hotels">
          {topShops.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topShops} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(14,100%,63%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No shop data yet</p>}
        </ChartCard>
      </div>

      {/* Peak hours */}
      <ChartCard title="Peak Hours Heatmap">
        <div className="grid grid-cols-12 gap-1">
          {peakHours.map(h => {
            const max = Math.max(...peakHours.map(p => p.count), 1);
            const intensity = h.count / max;
            return (
              <div key={h.hour} className="text-center" title={`${h.hour}: ${h.count} orders`}>
                <div className="rounded h-8 mb-1" style={{ backgroundColor: `hsl(14, 100%, ${95 - intensity * 55}%)` }} />
                <span className="text-[9px] text-muted-foreground">{h.hour.split(':')[0]}</span>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, iconColor, dot, onClick }: any) => (
  <div onClick={onClick} className={`${color} rounded-xl p-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {dot && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
    </div>
    <p className="font-bold text-xl text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <h3 className="font-semibold text-sm text-gray-800 mb-3">{title}</h3>
    {children}
  </div>
);

export default AdminOverview;
