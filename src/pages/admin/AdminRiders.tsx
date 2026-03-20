import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Shield, ShieldOff, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const PAGE_SIZE = 25;

const AdminRiders = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [ratings, setRatings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    const [r, p, rt, o] = await Promise.all([
      (supabase as any).from('riders').select('*'),
      (supabase as any).from('profiles').select('*'),
      (supabase as any).from('ratings').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('orders').select('id, rider_id, status, delivery_fee'),
    ]);
    setRiders(r.data || []);
    const pMap: Record<string, any> = {};
    (p.data || []).forEach((pr: any) => pMap[pr.id] = pr);
    setProfiles(pMap);
    setRatings(rt.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleVerified = async (rider: any) => {
    const newVal = !rider.is_verified;
    await (supabase as any).from('riders').update({ is_verified: newVal }).eq('id', rider.id);
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, is_verified: newVal } : r));
    toast.success(newVal ? 'Rider verified ✅' : 'Verification removed');
  };

  const filtered = riders.filter(r => {
    if (!search) return true;
    const name = profiles[r.user_id]?.name?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search riders..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} riders</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Photo</th>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Verified</th>
                <th className="text-left p-3 font-medium text-gray-600">Rating</th>
                <th className="text-left p-3 font-medium text-gray-600">Deliveries</th>
                <th className="text-left p-3 font-medium text-gray-600">Earnings</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(rider => {
                const profile = profiles[rider.user_id];
                return (
                  <tr key={rider.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{rider.profile_photo_url ? <img src={rider.profile_photo_url} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-100" />}</td>
                    <td className="p-3">
                      <span className="font-medium">{profile?.name || '—'}</span>
                      <span className="ml-1.5">{TIER_ICONS[rider.tier] || ''}</span>
                    </td>
                    <td className="p-3"><span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${rider.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />{rider.is_available ? 'Online' : 'Offline'}</td>
                    <td className="p-3">{rider.is_verified ? '✅' : '❌'}</td>
                    <td className="p-3 text-xs">{Number(rider.average_rating).toFixed(1)} ⭐</td>
                    <td className="p-3 text-xs">{rider.total_deliveries}</td>
                    <td className="p-3 text-xs font-medium">PKR {Number(rider.total_earnings).toLocaleString()}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => setSelected(rider)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleVerified(rider)} className="p-1.5 rounded-lg hover:bg-gray-100">
                        {rider.is_verified ? <ShieldOff className="w-3.5 h-3.5 text-red-500" /> : <Shield className="w-3.5 h-3.5 text-green-600" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No riders found</td></tr>}
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
          <DialogHeader><DialogTitle>{profiles[selected?.user_id]?.name || 'Rider'} {TIER_ICONS[selected?.tier]}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {selected.profile_photo_url && <img src={selected.profile_photo_url} className="w-20 h-20 rounded-full mx-auto object-cover" />}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Phone</p><p>{profiles[selected.user_id]?.phone || '—'}</p></div>
                <div><p className="text-xs text-gray-500">Vehicle</p><p>{selected.vehicle_type}</p></div>
                <div><p className="text-xs text-gray-500">Verified</p><p>{selected.is_verified ? '✅ Yes' : '❌ No'}</p></div>
                <div><p className="text-xs text-gray-500">Rating</p><p>{Number(selected.average_rating).toFixed(1)} ⭐</p></div>
                <div><p className="text-xs text-gray-500">Deliveries</p><p>{selected.total_deliveries}</p></div>
                <div><p className="text-xs text-gray-500">Earnings</p><p>PKR {Number(selected.total_earnings).toLocaleString()}</p></div>
              </div>
              {selected.bio && <div><p className="text-xs text-gray-500">Bio</p><p>{selected.bio}</p></div>}

              <div>
                <p className="text-xs text-gray-500 mb-2">Reviews ({ratings.filter(r => r.rider_id === selected.user_id).length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ratings.filter(r => r.rider_id === selected.user_id).slice(0, 10).map(r => (
                    <div key={r.id} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1"><span className="text-xs">{'⭐'.repeat(r.rating)}</span><span className="text-[10px] text-gray-400 ml-auto">{format(new Date(r.created_at), 'MMM dd')}</span></div>
                      {r.review_text && <p className="text-xs mt-1">{r.review_text}</p>}
                    </div>
                  ))}
                  {ratings.filter(r => r.rider_id === selected.user_id).length === 0 && <p className="text-xs text-gray-400">No reviews yet</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRiders;
