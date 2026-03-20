import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

const AdminShops = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('shops');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const [s, h, p, o, pr, mi] = await Promise.all([
        (supabase as any).from('shops').select('*'),
        (supabase as any).from('hotel_profiles').select('*'),
        (supabase as any).from('profiles').select('*'),
        (supabase as any).from('orders').select('id, shop_id, hotel_id, status'),
        (supabase as any).from('products').select('id, shop_id'),
        (supabase as any).from('menu_items').select('id, hotel_id'),
      ]);
      setShops(s.data || []);
      setHotels(h.data || []);
      const pMap: Record<string, any> = {};
      (p.data || []).forEach((pr: any) => pMap[pr.id] = pr);
      setProfiles(pMap);
      setOrders(o.data || []);
      setProducts(pr.data || []);
      setMenuItems(mi.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const items = tab === 'shops' ? shops : hotels;
  const filtered = items.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = (tab === 'shops' ? i.shop_name : i.hotel_name)?.toLowerCase() || '';
    return name.includes(s) || i.village?.toLowerCase().includes(s);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList><TabsTrigger value="shops">Shops ({shops.length})</TabsTrigger><TabsTrigger value="hotels">Hotels ({hotels.length})</TabsTrigger></TabsList>
      </Tabs>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Photo</th>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Owner</th>
                <th className="text-left p-3 font-medium text-gray-600">Village</th>
                <th className="text-left p-3 font-medium text-gray-600">{tab === 'shops' ? 'Products' : 'Menu Items'}</th>
                <th className="text-left p-3 font-medium text-gray-600">Orders</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Registered</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(item => {
                const name = tab === 'shops' ? item.shop_name : item.hotel_name;
                const ownerId = tab === 'shops' ? item.owner_id : item.user_id;
                const logo = item.logo_url;
                const itemCount = tab === 'shops'
                  ? products.filter(p => p.shop_id === item.id).length
                  : menuItems.filter(m => m.hotel_id === item.id).length;
                const orderCount = orders.filter(o => tab === 'shops' ? o.shop_id === item.id : o.hotel_id === item.id).length;

                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{logo ? <img src={logo} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-gray-100" />}</td>
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-xs">{profiles[ownerId]?.name || '—'}</td>
                    <td className="p-3 text-xs">{item.village || '—'}</td>
                    <td className="p-3 text-xs">{itemCount}</td>
                    <td className="p-3 text-xs">{orderCount}</td>
                    <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.is_open ? 'Open' : 'Closed'}</span></td>
                    <td className="p-3 text-xs text-gray-500">{format(new Date(item.created_at), 'MMM dd, yyyy')}</td>
                    <td className="p-3"><button onClick={() => setSelected(item)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
              {paged.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No {tab} found</td></tr>}
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{tab === 'shops' ? selected?.shop_name : selected?.hotel_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {selected.logo_url && <img src={selected.logo_url} className="w-full h-40 rounded-xl object-cover" />}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Village</p><p>{selected.village || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p>{selected.category || selected.hotel_type || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Address</p><p>{selected.address || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><p>{selected.is_open ? '🟢 Open' : '⚫ Closed'}</p></div>
                <div><p className="text-xs text-gray-500">{tab === 'shops' ? 'Products' : 'Menu Items'}</p><p>{tab === 'shops' ? products.filter(p => p.shop_id === selected.id).length : menuItems.filter(m => m.hotel_id === selected.id).length}</p></div>
                <div><p className="text-xs text-gray-500">Total Orders</p><p>{orders.filter(o => tab === 'shops' ? o.shop_id === selected.id : o.hotel_id === selected.id).length}</p></div>
              </div>
              {selected.description && <div><p className="text-xs text-gray-500">Description</p><p>{selected.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShops;
