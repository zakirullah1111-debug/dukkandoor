import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Bell, Megaphone, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annRole, setAnnRole] = useState('all');
  const [annExpiry, setAnnExpiry] = useState('');

  const fetchData = async () => {
    const [b, a, p] = await Promise.all([
      (supabase as any).from('broadcast_logs').select('*').order('sent_at', { ascending: false }),
      (supabase as any).from('announcements').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('id, role, village'),
    ]);
    setBroadcasts(b.data || []);
    setAnnouncements(a.data || []);
    setProfiles(p.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getReachCount = () => {
    if (target === 'all') return profiles.length;
    return profiles.filter(p => p.role === target).length;
  };

  const sendBroadcast = async () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and body required'); return; }
    if (!confirm(`Send to ${getReachCount()} users?`)) return;
    setSending(true);
    await (supabase as any).from('broadcast_logs').insert({
      target_group: target, title: title.trim(), body: body.trim(), reach_count: getReachCount(),
    });
    toast.success('Broadcast sent!');
    setTitle(''); setBody(''); setTarget('all');
    setSending(false);
    fetchData();
  };

  const createAnnouncement = async () => {
    if (!annTitle.trim()) { toast.error('Title required'); return; }
    await (supabase as any).from('announcements').insert({
      title: annTitle.trim(), body: annBody.trim(),
      target_role: annRole === 'all' ? null : annRole,
      expires_at: annExpiry || null, is_active: true,
    });
    toast.success('Announcement created!');
    setAnnTitle(''); setAnnBody(''); setAnnRole('all'); setAnnExpiry('');
    fetchData();
  };

  const toggleAnnouncement = async (id: string, active: boolean) => {
    await (supabase as any).from('announcements').update({ is_active: !active }).eq('id', id);
    fetchData();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await (supabase as any).from('announcements').delete().eq('id', id);
    toast.success('Deleted');
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="broadcast">
        <TabsList><TabsTrigger value="broadcast"><Bell className="w-3.5 h-3.5 mr-1.5" />Broadcast</TabsTrigger><TabsTrigger value="announcements"><Megaphone className="w-3.5 h-3.5 mr-1.5" />Announcements</TabsTrigger></TabsList>

        <TabsContent value="broadcast" className="space-y-4 mt-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm">Send Broadcast Notification</h3>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="customer">Customers Only</SelectItem>
                <SelectItem value="farmer">Farmers Only</SelectItem>
                <SelectItem value="rider">Riders Only</SelectItem>
                <SelectItem value="shopkeeper">Shopkeepers Only</SelectItem>
                <SelectItem value="hotel">Hotels Only</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Notification title (max 60 chars)" value={title} onChange={e => setTitle(e.target.value.slice(0, 60))} />
            <Textarea placeholder="Message body (max 200 chars)" value={body} onChange={e => setBody(e.target.value.slice(0, 200))} rows={3} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Reach: {getReachCount()} users</span>
              <Button onClick={sendBroadcast} disabled={sending}><Send className="w-4 h-4 mr-1.5" />Send Now</Button>
            </div>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-gray-50 rounded-xl p-4 border">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <p className="font-semibold text-sm">{title || 'Title'}</p>
                <p className="text-xs text-gray-600 mt-1">{body || 'Body'}</p>
              </div>
            </div>
          )}

          {/* Broadcast history */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b"><h3 className="font-semibold text-sm">Broadcast History</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="text-left p-3 text-gray-600 font-medium">Target</th><th className="text-left p-3 text-gray-600 font-medium">Title</th><th className="text-left p-3 text-gray-600 font-medium">Reach</th><th className="text-left p-3 text-gray-600 font-medium">Sent</th></tr></thead>
                <tbody>
                  {broadcasts.map(b => (
                    <tr key={b.id} className="border-b"><td className="p-3 text-xs capitalize">{b.target_group}</td><td className="p-3 text-xs font-medium">{b.title}</td><td className="p-3 text-xs">{b.reach_count}</td><td className="p-3 text-xs text-gray-500">{format(new Date(b.sent_at), 'MMM dd, HH:mm')}</td></tr>
                  ))}
                  {broadcasts.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-gray-400">No broadcasts sent yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm">Create Announcement Banner</h3>
            <Input placeholder="Announcement title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
            <Textarea placeholder="Body text" value={annBody} onChange={e => setAnnBody(e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={annRole} onValueChange={setAnnRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="farmer">Farmers</SelectItem>
                  <SelectItem value="rider">Riders</SelectItem>
                  <SelectItem value="shopkeeper">Shopkeepers</SelectItem>
                  <SelectItem value="hotel">Hotels</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={annExpiry} onChange={e => setAnnExpiry(e.target.value)} placeholder="Expiry date" />
            </div>
            <Button onClick={createAnnouncement}>Create Announcement</Button>
          </div>

          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    {a.body && <p className="text-xs text-gray-600 mt-1">{a.body}</p>}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{a.target_role || 'All'}</span>
                      {a.expires_at && <span className="text-[10px] text-gray-400">Expires: {format(new Date(a.expires_at), 'MMM dd')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.is_active} onCheckedChange={() => toggleAnnouncement(a.id, a.is_active)} />
                    <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center text-gray-400 py-6">No announcements yet</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
