import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, X, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminVillages = () => {
  const [villages, setVillages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editVillage, setEditVillage] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [newVillage, setNewVillage] = useState('');

  const fetchData = async () => {
    const [v, p] = await Promise.all([
      (supabase as any).from('villages').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('id, name, village'),
    ]);
    setVillages(v.data || []);
    const pMap: Record<string, any> = {};
    (p.data || []).forEach((pr: any) => pMap[pr.id] = pr);
    setProfiles(pMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pending = villages.filter(v => v.status === 'pending');

  const approve = async (id: string) => {
    await (supabase as any).from('villages').update({ status: 'approved' }).eq('id', id);
    toast.success('Village approved ✅');
    fetchData();
  };

  const reject = async (id: string) => {
    await (supabase as any).from('villages').update({ status: 'rejected' }).eq('id', id);
    toast.success('Village rejected');
    fetchData();
  };

  const deleteVillage = async (id: string) => {
    if (!confirm('Delete this village?')) return;
    await (supabase as any).from('villages').delete().eq('id', id);
    toast.success('Village deleted');
    fetchData();
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await (supabase as any).from('villages').update({ name: editName.trim() }).eq('id', editVillage.id);
    toast.success('Village name updated');
    setEditVillage(null);
    fetchData();
  };

  const addVillage = async () => {
    if (!newVillage.trim()) return;
    await (supabase as any).from('villages').insert({ name: newVillage.trim(), status: 'approved', source: 'system', submitted_by: null });
    toast.success('Village added');
    setNewVillage('');
    fetchData();
  };

  // Count users per village from profiles
  const getUserCount = (villageName: string) => {
    return Object.values(profiles).filter((p: any) => p.village?.toLowerCase() === villageName.toLowerCase()).length;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">⚠️ {pending.length} village(s) awaiting your approval</span>
        </div>
      )}

      <div className="flex gap-3">
        <Input placeholder="Add new village..." value={newVillage} onChange={e => setNewVillage(e.target.value)} className="max-w-xs" />
        <Button onClick={addVillage} disabled={!newVillage.trim()}>Add Village</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Village Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Source</th>
                <th className="text-left p-3 font-medium text-gray-600">Submitted By</th>
                <th className="text-left p-3 font-medium text-gray-600">Users</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {villages.map(v => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{v.name}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      v.status === 'approved' ? 'bg-green-100 text-green-700' :
                      v.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>{v.status}</span>
                  </td>
                  <td className="p-3 text-xs">{v.source}</td>
                  <td className="p-3 text-xs">{v.submitted_by ? profiles[v.submitted_by]?.name || '—' : '—'}</td>
                  <td className="p-3 text-xs">{getUserCount(v.name)}</td>
                  <td className="p-3 text-xs text-gray-500">{format(new Date(v.created_at), 'MMM dd, yyyy')}</td>
                  <td className="p-3 flex gap-1">
                    {v.status === 'pending' && (
                      <>
                        <button onClick={() => approve(v.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => reject(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    <button onClick={() => { setEditVillage(v); setEditName(v.name); }} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteVillage(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {villages.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No villages yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editVillage} onOpenChange={() => setEditVillage(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Village Name</DialogTitle></DialogHeader>
          <Input value={editName} onChange={e => setEditName(e.target.value)} />
          <DialogFooter><Button onClick={saveEdit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVillages;
