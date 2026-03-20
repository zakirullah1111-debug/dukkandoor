import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Check, Zap, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';

const PAGE_SIZE = 25;

const AdminReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    const [r, p] = await Promise.all([
      (supabase as any).from('reports').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('*'),
    ]);
    setReports(r.data || []);
    const pMap: Record<string, any> = {};
    (p.data || []).forEach((pr: any) => pMap[pr.id] = pr);
    setProfiles(pMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await (supabase as any).from('reports').update({ status }).eq('id', id);
    toast.success(`Report marked as ${status}`);
    fetchData();
  };

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const reporter = profiles[r.reported_by]?.name?.toLowerCase() || '';
      const reported = profiles[r.reported_user_id]?.name?.toLowerCase() || '';
      if (!reporter.includes(s) && !reported.includes(s) && !r.reason?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search reports..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="action_taken">Action Taken</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">{filtered.length} reports</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Filed By</th>
                <th className="text-left p-3 font-medium text-gray-600">Reported</th>
                <th className="text-left p-3 font-medium text-gray-600">Reason</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(report => {
                const isOverdue = report.status === 'pending' && differenceInHours(new Date(), new Date(report.created_at)) > 24;
                return (
                  <tr key={report.id} className={`border-b hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="p-3 font-mono text-xs">#{report.id.slice(0, 8)}{isOverdue && <span className="ml-1 text-xs">🔴</span>}</td>
                    <td className="p-3 text-xs">
                      <span>{profiles[report.reported_by]?.name || '—'}</span>
                      <span className="text-gray-400 ml-1">({profiles[report.reported_by]?.role})</span>
                    </td>
                    <td className="p-3 text-xs">
                      <span>{profiles[report.reported_user_id]?.name || '—'}</span>
                      <span className="text-gray-400 ml-1">({profiles[report.reported_user_id]?.role})</span>
                    </td>
                    <td className="p-3 text-xs">{report.reason}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>{report.status}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{format(new Date(report.created_at), 'MMM dd, HH:mm')}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => setSelected(report)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5" /></button>
                      {report.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(report.id, 'reviewed')} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => updateStatus(report.id, 'action_taken')} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><Zap className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No reports found</td></tr>}
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Report #{selected?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Filed By</p><p>{profiles[selected.reported_by]?.name} ({profiles[selected.reported_by]?.role})</p></div>
                <div><p className="text-xs text-gray-500">Reported</p><p>{profiles[selected.reported_user_id]?.name} ({profiles[selected.reported_user_id]?.role})</p></div>
                <div><p className="text-xs text-gray-500">Reason</p><p className="font-medium">{selected.reason}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><p>{selected.status}</p></div>
              </div>
              {selected.description && <div><p className="text-xs text-gray-500">Description</p><p>{selected.description}</p></div>}
              {selected.order_id && <div><p className="text-xs text-gray-500">Order ID</p><p className="font-mono text-xs">#{selected.order_id.slice(0, 8)}</p></div>}
              <p className="text-xs text-gray-400">{format(new Date(selected.created_at), 'PPp')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
