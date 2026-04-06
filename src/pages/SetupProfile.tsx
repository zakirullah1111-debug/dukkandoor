import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

const SetupProfile = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customVillage, setCustomVillage] = useState('');

  useEffect(() => {
    (supabase as any)
      .from('villages')
      .select('id, name')
      .eq('status', 'approved')
      .order('name')
      .then(({ data }: any) => {
        setVillages(data || []);
        setLoadingVillages(false);
      });
  }, []);

  if (authLoading) return null;
  if (!session) { navigate('/', { replace: true }); return null; }
  if (user?.name) {
    const routes: Record<string, string> = { customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider', admin: '/admin', farmer: '/farmer', hotel: '/hotel' };
    navigate(routes[user.role] || '/home', { replace: true });
    return null;
  }

  const handleAddCustomVillage = async () => {
    const trimmed = customVillage.trim();
    if (!trimmed) return;
    await (supabase as any).from('villages').insert({
      name: trimmed,
      status: 'approved',
      source: 'user',
      submitted_by: session.user.id,
    });
    setVillage(trimmed);
    setShowCustomInput(false);
    toast.success('Village added successfully!');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !village) return;
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), village });

      if (user?.role === 'rider') {
        await (supabase as any).from('riders').insert({
          user_id: session.user.id,
          is_available: false,
          vehicle_type: 'Motorcycle',
        });
      }

      toast.success('Profile saved!');
      if (user?.role === 'shopkeeper') {
        navigate('/shopkeeper/setup', { replace: true });
      } else if (user?.role === 'farmer') {
        navigate('/farmer/setup', { replace: true });
      } else if (user?.role === 'hotel') {
        navigate('/hotel/setup', { replace: true });
      } else {
        const routes: Record<string, string> = { customer: '/home', rider: '/rider', admin: '/admin' };
        navigate(routes[user?.role || 'customer'] || '/home', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Complete your profile</h1>
      <p className="text-muted-foreground mt-1">Tell us a bit about yourself</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Full Name</label>
          <Input
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-14 text-base rounded-xl"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Your Village / Area</label>
          {loadingVillages ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {villages.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setVillage(v.name); setShowCustomInput(false); }}
                    className={`h-12 rounded-xl border-2 text-sm font-medium transition-all ${
                      village === v.name && !showCustomInput
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-foreground hover:border-primary/30'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
                <button
                  onClick={() => { setShowCustomInput(true); setVillage(''); }}
                  className={`h-12 rounded-xl border-2 border-dashed text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    showCustomInput
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Your Village
                </button>
              </div>

              {showCustomInput && (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Enter your village name"
                    value={customVillage}
                    onChange={e => setCustomVillage(e.target.value)}
                    className="h-12 rounded-xl"
                    autoFocus
                  />
                  <Button
                    onClick={handleAddCustomVillage}
                    disabled={!customVillage.trim()}
                    variant="secondary"
                    className="w-full h-11 rounded-xl"
                  >
                    Submit Village
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your village will appear for others after admin approval
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !village || saving}
          className="w-full h-14 text-base font-display font-semibold rounded-xl mt-4"
        >
          {saving ? 'Saving...' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};

export default SetupProfile;
