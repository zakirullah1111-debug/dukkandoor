import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Ban, CheckCircle, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700', farmer: 'bg-green-100 text-green-700',
  shopkeeper: 'bg-orange-100 text-orange-700', hotel: 'bg-purple-100 text-purple-700',
  rider: 'bg-yellow-100 text-yellow-700', admin: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 25;

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchData = async () => {
    const [p, o] = await Promise.all([
      (supabase as any).from('profiles').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('orders').select('id, customer_id, status, total_amount, delivery_fee'),
    ]);
    setProfiles(p.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = profiles.filter(p => {
    if (tab !== 'all' && p.role !== tab) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.name?.toLowerCase().includes(s) && !p.phone?.includes(s) && !p.village?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getUserStat = (userId: string, role: string) => {
    if (role === 'customer' || role === 'farmer') {
      return `${orders.filter(o => o.customer_id === userId).length} orders`;
    }
    return '';
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({profiles.length})</TabsTrigger>
          {['customer', 'farmer', 'shopkeeper', 'hotel', 'rider'].map(r => (
            <TabsTrigger key={r} value={r} className="capitalize">{r}s ({profiles.filter(p => p.role === r).length})</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, phone, village..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} users</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Phone</th>
                <th className="text-left p-3 font-medium text-gray-600">Role</th>
                <th className="text-left p-3 font-medium text-gray-600">Village</th>
                <th className="text-left p-3 font-medium text-gray-600">Stats</th>
                <th className="text-left p-3 font-medium text-gray-600">Registered</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium">{user.name || '—'}</td>
                  <td className="p-3 text-xs text-gray-500">{user.phone}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ROLE_COLORS[user.role]}`}>{user.role}</span></td>
                  <td className="p-3 text-xs">{user.village || '—'}</td>
                  <td className="p-3 text-xs text-gray-500">{getUserStat(user.id, user.role)}</td>
                  <td className="p-3 text-xs text-gray-500">{format(new Date(user.created_at), 'MMM dd, yyyy')}</td>
                  <td className="p-3">
                    <button onClick={() => setSelectedUser(user)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedUser?.name || 'User'}</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Role</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[selectedUser.role]}`}>{selectedUser.role}</span></div>
                <div><p className="text-xs text-gray-500">Phone</p><p>{selectedUser.phone}</p></div>
                <div><p className="text-xs text-gray-500">Village</p><p>{selectedUser.village || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Address</p><p>{selectedUser.address || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Registered</p><p>{format(new Date(selectedUser.created_at), 'PPp')}</p></div>
                <div><p className="text-xs text-gray-500">Total Orders</p><p>{orders.filter(o => o.customer_id === selectedUser.id).length}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Total Spent</p><p className="font-medium">PKR {orders.filter(o => o.customer_id === selectedUser.id && o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString()}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
