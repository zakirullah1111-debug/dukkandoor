import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const villages = ['Chak 45', 'Chak 60', 'Chak 72', 'Moza Ali', 'Basti Lal'];

const SetupProfile = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);

  if (authLoading) return null;
  if (!session) { navigate('/', { replace: true }); return null; }
  if (user?.name) {
    const routes: Record<string, string> = { customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider', admin: '/admin' };
    navigate(routes[user.role] || '/home', { replace: true });
    return null;
  }

  const handleSubmit = async () => {
    if (!name.trim() || !village) return;
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), village });

      // If rider, also create rider record
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
          <div className="grid grid-cols-2 gap-2">
            {villages.map(v => (
              <button
                key={v}
                onClick={() => setVillage(v)}
                className={`h-12 rounded-xl border-2 text-sm font-medium transition-all ${
                  village === v
                    ? 'border-primary bg-orange-light text-primary'
                    : 'border-border text-foreground hover:border-primary/30'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!name.trim() || !village || saving} className="w-full h-14 text-base font-display font-semibold rounded-xl mt-4">
          {saving ? 'Saving...' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};

export default SetupProfile;
