import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  customer: 'Customer',
  shopkeeper: 'Shopkeeper',
  rider: 'Delivery Rider',
  farmer: 'Farmer',
  hotel: 'Hotel Owner',
};

const SetupProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading, updateUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customVillage, setCustomVillage] = useState('');
  const [open, setOpen] = useState(false);

  // The role the user selected on the Welcome screen
  const intendedRole = (location.state as any)?.intendedRole;

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

  // Role mismatch check — runs when user profile loads
  useEffect(() => {
    if (authLoading || !session || !user) return;
    if (!intendedRole) return;
    if (!user.name) return; // new user, no redirect yet

    if (user.role !== intendedRole) {
      // Existing user tried to log in with wrong role — log them out immediately
      const existingRoleLabel = roleLabels[user.role] || user.role;
      logout().then(() => {
        toast.error(
          `This number is already registered as a ${existingRoleLabel}. Please go back and select "${existingRoleLabel}" to continue.`,
          { duration: 6000 }
        );
        navigate('/', { replace: true });
      });
    }
  }, [authLoading, session, user, intendedRole]);

  if (authLoading) return null;
  if (!session) { navigate('/', { replace: true }); return null; }
  if (user?.name) {
    // Only redirect if there is no mismatch (mismatch handled in useEffect above)
    if (!intendedRole || user.role === intendedRole) {
      const routes: Record<string, string> = { customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider', admin: '/admin', farmer: '/farmer', hotel: '/hotel' };
      navigate(routes[user.role] || '/home', { replace: true });
    }
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
    setVillages(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    setVillage(trimmed);
    setShowCustomInput(false);
    setCustomVillage('');
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-14 justify-between rounded-xl text-base font-normal"
                  >
                    {village ? village : 'Select your village...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search village..." />
                    <CommandList>
                      <CommandEmpty>No village found.</CommandEmpty>
                      <CommandGroup>
                        {villages.map(v => (
                          <CommandItem
                            key={v.id}
                            value={v.name}
                            onSelect={() => {
                              setVillage(v.name);
                              setShowCustomInput(false);
                              setOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', village === v.name ? 'opacity-100' : 'opacity-0')} />
                            {v.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setShowCustomInput(true);
                            setVillage('');
                            setOpen(false);
                          }}
                          className="text-primary"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your Village
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

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
