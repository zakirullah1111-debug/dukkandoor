import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const villages = ['Chak 45', 'Chak 60', 'Chak 72', 'Moza Ali', 'Basti Lal'];

const SetupProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = () => {
    if (!name.trim() || !village) return;
    updateUser({ name: name.trim(), village });
    const routes: Record<string, string> = { customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider', admin: '/admin' };
    navigate(routes[user.role] || '/home', { replace: true });
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

        <Button onClick={handleSubmit} disabled={!name.trim() || !village} className="w-full h-14 text-base font-display font-semibold rounded-xl mt-4">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default SetupProfile;
