import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Bike, Package, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(14, 100%, 63%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(220, 13%, 91%)'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [ordersRes, shopsRes, ridersRes] = await Promise.all([
        (supabase as any).from('orders').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('shops').select('*'),
        (supabase as any).from('riders').select('*, profiles(name)'),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (shopsRes.data) setShops(shopsRes.data);
      if (ridersRes.data) setRiders(ridersRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0);

  // Simple category distribution
  const catCounts = shops.reduce((acc: any, s: any) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  // Orders per status
  const barData = ['placed', 'confirmed', 'picked_up', 'delivered', 'cancelled'].map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length,
  }));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">DukkanDoor Platform</p>
        </div>
        <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-orange-light rounded-xl p-4 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-xl">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="bg-green-light rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-xl">Rs {Math.round(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <Store className="w-5 h-5 mx-auto text-foreground mb-1" />
          <p className="font-display font-bold text-xl">{shops.length}</p>
          <p className="text-xs text-muted-foreground">Active Shops</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <Bike className="w-5 h-5 mx-auto text-foreground mb-1" />
          <p className="font-display font-bold text-xl">{riders.length}</p>
          <p className="text-xs text-muted-foreground">Riders</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-display font-semibold text-sm mb-3">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(14, 100%, 63%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {pieData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Shop Categories</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold">All Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Order ID</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map(order => (
                <tr key={order.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">#{order.id.slice(-6)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      order.status === 'delivered' ? 'bg-green-light text-accent' :
                      order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-orange-light text-primary'
                    }`}>{order.status}</span>
                  </td>
                  <td className="p-3 font-semibold">Rs {Math.round(order.total_amount)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shops */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-display font-semibold mb-3">Shops</h3>
        <div className="space-y-2">
          {shops.map(shop => (
            <div key={shop.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-semibold text-sm">{shop.shop_name}</p>
                <p className="text-xs text-muted-foreground">{shop.category} • {shop.village}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shop.is_open ? 'bg-green-light text-accent' : 'bg-muted text-muted-foreground'}`}>
                {shop.is_open ? 'Active' : 'Closed'}
              </span>
            </div>
          ))}
          {shops.length === 0 && <p className="text-muted-foreground text-sm">No shops registered yet</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
