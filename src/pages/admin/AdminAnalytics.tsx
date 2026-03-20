import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { format, subDays, startOfDay, endOfDay, subWeeks, getDay } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [o, p, r] = await Promise.all([
        (supabase as any).from('orders').select('*'),
        (supabase as any).from('profiles').select('*'),
        (supabase as any).from('riders').select('*'),
      ]);
      setOrders(o.data || []);
      setProfiles(p.data || []);
      setRiders(r.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const now = new Date();

  // Village performance
  const villageMap: Record<string, { users: number; orders: number; revenue: number }> = {};
  profiles.forEach(p => {
    if (!p.village) return;
    if (!villageMap[p.village]) villageMap[p.village] = { users: 0, orders: 0, revenue: 0 };
    villageMap[p.village].users++;
  });
  orders.forEach(o => {
    const cust = profiles.find(p => p.id === o.customer_id);
    if (!cust?.village) return;
    if (!villageMap[cust.village]) villageMap[cust.village] = { users: 0, orders: 0, revenue: 0 };
    villageMap[cust.village].orders++;
    if (o.status === 'delivered') villageMap[cust.village].revenue += Number(o.total_amount);
  });
  const villageData = Object.entries(villageMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.orders - a.orders);

  // Day of week
  const dayData = DAYS.map((name, i) => ({ name, count: orders.filter(o => getDay(new Date(o.created_at)) === i).length }));

  // Hour of day
  const hourData = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: orders.filter(o => new Date(o.created_at).getHours() === h).length }));

  // Month over month (last 6 months)
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthOrders = orders.filter(o => { const od = new Date(o.created_at); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); });
    return { month: format(d, 'MMM yyyy'), count: monthOrders.length };
  });

  // User retention
  const thisWeek = profiles.filter(p => new Date(p.created_at) >= subWeeks(now, 1)).length;
  const lastWeek = profiles.filter(p => { const d = new Date(p.created_at); return d >= subWeeks(now, 2) && d < subWeeks(now, 1); }).length;
  const multiOrder = profiles.filter(p => orders.filter(o => o.customer_id === p.id).length >= 2).length;
  const singleOrder = profiles.filter(p => orders.filter(o => o.customer_id === p.id).length === 1).length;
  const inactiveRiders = riders.filter(r => orders.filter(o => o.rider_id === r.user_id && new Date(o.created_at) >= subDays(now, 7)).length === 0).length;

  // Order success
  const completed = orders.filter(o => o.status === 'delivered').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const total = orders.length || 1;

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => exportCSV(orders.map(o => ({ id: o.id, type: o.order_type, status: o.status, total: o.total_amount, fee: o.delivery_fee, date: o.created_at })), 'orders.csv')}>
          <Download className="w-3.5 h-3.5 mr-1.5" />Export Orders CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportCSV(profiles.map(p => ({ id: p.id, name: p.name, phone: p.phone, role: p.role, village: p.village, date: p.created_at })), 'users.csv')}>
          <Download className="w-3.5 h-3.5 mr-1.5" />Export Users CSV
        </Button>
      </div>

      {/* Village Performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b"><h3 className="font-semibold text-sm">Village Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left p-3 font-medium text-gray-600">Village</th><th className="text-left p-3 font-medium text-gray-600">Users</th><th className="text-left p-3 font-medium text-gray-600">Orders</th><th className="text-left p-3 font-medium text-gray-600">Revenue</th></tr></thead>
            <tbody>
              {villageData.map(v => (
                <tr key={v.name} className="border-b"><td className="p-3 font-medium">{v.name}</td><td className="p-3">{v.users}</td><td className="p-3">{v.orders}</td><td className="p-3 font-medium">PKR {v.revenue.toLocaleString()}</td></tr>
              ))}
              {villageData.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-gray-400">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Best Performing Day">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="hsl(14,100%,63%)" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Best Performing Hour">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="hour" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Order Growth">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="hsl(14,100%,63%)" strokeWidth={2} /></LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Success Rate">
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center"><span className="text-sm">Completed</span><span className="font-bold text-green-600">{((completed / total) * 100).toFixed(1)}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{ width: `${(completed / total) * 100}%` }} /></div>
            <div className="flex justify-between items-center"><span className="text-sm">Cancelled</span><span className="font-bold text-red-600">{((cancelled / total) * 100).toFixed(1)}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-red-500 h-3 rounded-full" style={{ width: `${(cancelled / total) * 100}%` }} /></div>
          </div>
        </ChartCard>
      </div>

      {/* User Retention */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-sm mb-4">User Retention</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="New users this week" value={thisWeek} />
          <Stat label="New users last week" value={lastWeek} />
          <Stat label="Retained (2+ orders)" value={multiOrder} />
          <Stat label="At risk (1 order)" value={singleOrder} />
          <Stat label="Inactive riders (7d)" value={inactiveRiders} />
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><h3 className="font-semibold text-sm mb-3">{title}</h3>{children}</div>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center"><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>
);

export default AdminAnalytics;
