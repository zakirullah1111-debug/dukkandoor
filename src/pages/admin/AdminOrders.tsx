import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  rider_assigned: 'bg-orange-100 text-orange-700',
  picked_up: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  shop_order: 'Shop', home_pickup: 'Home Pickup', farm_shop_order: 'Farm Shop', farm_food_order: 'Farm Food',
};

const PAGE_SIZE = 25;

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [shops, setShops] = useState<Record<string, any>>({});

  const fetchData = async () => {
    const [ordersRes, profilesRes, shopsRes, hotelsRes] = await Promise.all([
      (supabase as any).from('orders').select('*, order_items(*, products(name))').order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('*'),
      (supabase as any).from('shops').select('*'),
      (supabase as any).from('hotel_profiles').select('*'),
    ]);
    setOrders(ordersRes.data || []);
    const pMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => pMap[p.id] = p);
    setProfiles(pMap);
    const sMap: Record<string, any> = {};
    (shopsRes.data || []).forEach((s: any) => sMap[s.id] = s);
    (hotelsRes.data || []).forEach((h: any) => sMap[h.id] = h);
    setShops(sMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.order_type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const cust = profiles[o.customer_id]?.name?.toLowerCase() || '';
      const shop = shops[o.shop_id]?.shop_name?.toLowerCase() || shops[o.hotel_id]?.hotel_name?.toLowerCase() || '';
      if (!o.id.includes(s) && !cust.includes(s) && !shop.includes(s)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Force cancel this order?')) return;
    await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    toast.success('Order cancelled');
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by ID, customer, shop..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Type</th>
                <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                <th className="text-left p-3 font-medium text-gray-600">Shop/Hotel</th>
                <th className="text-left p-3 font-medium text-gray-600">Rider</th>
                <th className="text-left p-3 font-medium text-gray-600">Fee</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[order.order_type] || order.order_type}</Badge>
                    {order.urgent && <span className="ml-1 text-xs">🚨</span>}
                  </td>
                  <td className="p-3 text-xs">{profiles[order.customer_id]?.name || '—'}</td>
                  <td className="p-3 text-xs">{shops[order.shop_id]?.shop_name || shops[order.hotel_id]?.hotel_name || '—'}</td>
                  <td className="p-3 text-xs">{order.rider_id ? (profiles[order.rider_id]?.name || 'Assigned') : <span className="text-gray-400">Unassigned</span>}</td>
                  <td className="p-3 text-xs font-medium">PKR {Number(order.delivery_fee)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status}</span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</td>
                  <td className="p-3 flex gap-1">
                    <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5" /></button>
                    {!['delivered', 'cancelled'].includes(order.status) && (
                      <button onClick={() => cancelOrder(order.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order #{selectedOrder?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Status</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
                <div><p className="text-xs text-gray-500">Type</p><p className="font-medium">{TYPE_LABELS[selectedOrder.order_type]}{selectedOrder.urgent ? ' 🚨' : ''}</p></div>
                <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{profiles[selectedOrder.customer_id]?.name || '—'}</p><p className="text-xs text-gray-400">{profiles[selectedOrder.customer_id]?.phone}</p></div>
                <div><p className="text-xs text-gray-500">Shop/Hotel</p><p className="font-medium">{shops[selectedOrder.shop_id]?.shop_name || shops[selectedOrder.hotel_id]?.hotel_name || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Rider</p><p className="font-medium">{selectedOrder.rider_id ? profiles[selectedOrder.rider_id]?.name : 'Unassigned'}</p></div>
                <div><p className="text-xs text-gray-500">Delivery Fee</p><p className="font-medium">PKR {Number(selectedOrder.delivery_fee)}</p></div>
              </div>

              {selectedOrder.delivery_address && (
                <div><p className="text-xs text-gray-500">Delivery Address</p><p>{selectedOrder.delivery_address}</p></div>
              )}
              {selectedOrder.customer_note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 font-medium">📝 Customer Note</p>
                  <p className="text-sm">{selectedOrder.customer_note}</p>
                </div>
              )}
              {selectedOrder.items_description && (
                <div><p className="text-xs text-gray-500">Items Description</p><p>{selectedOrder.items_description}</p></div>
              )}

              {/* Order items */}
              {selectedOrder.order_items?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Items</p>
                  {selectedOrder.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                      <span className="font-medium">PKR {Number(item.price_at_order) * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedOrder.delivery_photo_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Delivery Photo</p>
                  <img src={selectedOrder.delivery_photo_url} alt="Delivery proof" className="rounded-lg w-full max-h-48 object-cover" />
                </div>
              )}

              <div><p className="text-xs text-gray-500">Placed at</p><p>{format(new Date(selectedOrder.created_at), 'PPp')}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
