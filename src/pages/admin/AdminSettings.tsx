import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SETTINGS_KEYS = [
  { key: 'platform_name', label: 'Platform Name', type: 'text' },
  { key: 'min_delivery_fee', label: 'Minimum Delivery Fee (PKR)', type: 'number' },
  { key: 'max_delivery_fee', label: 'Maximum Delivery Fee (PKR)', type: 'number' },
  { key: 'max_farm_radius_km', label: 'Max Farm Delivery Radius (km)', type: 'number' },
  { key: 'cancel_window_minutes', label: 'Order Cancellation Window (minutes)', type: 'number' },
  { key: 'rider_exclusive_seconds', label: 'Rider Exclusive Window (seconds)', type: 'number' },
  { key: 'report_escalation_hours', label: 'Report Auto-Escalation (hours)', type: 'number' },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any).from('admin_settings').select('*');
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => map[s.key] = s.value);
      setSettings(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      for (const { key } of SETTINGS_KEYS) {
        if (settings[key] !== undefined) {
          await (supabase as any).from('admin_settings').update({ value: settings[key], updated_at: new Date().toISOString() }).eq('key', key);
        }
      }
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="font-semibold">Platform Settings</h3>
        {SETTINGS_KEYS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
            <Input type={type} value={settings[key] || ''} onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))} />
          </div>
        ))}
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
