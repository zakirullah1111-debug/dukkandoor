import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, MapPin, Pencil, Save, X, Loader2, Plus, Check, ChevronsUpDown } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);

  // Village dropdown state
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customVillage, setCustomVillage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setVillage(user.village || '');
    }
  }, [user]);

  const startEditing = () => {
    setEditing(true);
    setLoadingVillages(true);
    (supabase as any)
      .from('villages')
      .select('id, name')
      .eq('status', 'approved')
      .order('name')
      .then(({ data }: any) => {
        setVillages(data || []);
        setLoadingVillages(false);
      });
  };

  const cancelEditing = () => {
    setEditing(false);
    setName(user?.name || '');
    setVillage(user?.village || '');
    setShowCustomInput(false);
    setCustomVillage('');
  };

  const handleAddCustomVillage = async () => {
    const trimmed = customVillage.trim();
    if (!trimmed) return;
    await (supabase as any).from('villages').insert({
      name: trimmed,
      status: 'approved',
      source: 'user',
      submitted_by: user?.id,
    });
    setVillages(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    setVillage(trimmed);
    setShowCustomInput(false);
    setCustomVillage('');
    toast.success('Village added!');
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    if (!village) return toast.error('Village is required');
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), village });
      toast.success('Profile updated!');
      setEditing(false);
      setShowCustomInput(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <span className="font-display text-2xl font-bold">{user?.name?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{user?.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" size="icon" onClick={startEditing}>
              <Pencil className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {/* Name */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            {editing ? (
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-10 rounded-lg"
                placeholder="Your full name"
              />
            ) : (
              <p className="font-semibold text-sm">{user?.name}</p>
            )}
          </div>

          {/* Phone (read-only) */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-semibold text-sm">{user?.phone}</p>
            </div>
          </div>

          {/* Village */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Village</p>
            </div>
            {editing ? (
              loadingVillages ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-10 justify-between rounded-lg text-sm font-normal"
                      >
                        {village || 'Select your village...'}
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
                                onSelect={() => { setVillage(v.name); setShowCustomInput(false); setOpen(false); }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', village === v.name ? 'opacity-100' : 'opacity-0')} />
                                {v.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => { setShowCustomInput(true); setVillage(''); setOpen(false); }}
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
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Enter your village name"
                        value={customVillage}
                        onChange={e => setCustomVillage(e.target.value)}
                        className="h-10 rounded-lg"
                        autoFocus
                      />
                      <Button
                        onClick={handleAddCustomVillage}
                        disabled={!customVillage.trim()}
                        variant="secondary"
                        size="sm"
                        className="w-full rounded-lg"
                      >
                        Submit Village
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              <p className="font-semibold text-sm">{user?.village}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {editing ? (
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={cancelEditing} disabled={saving}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button className="flex-1 h-12 rounded-xl" onClick={handleSave} disabled={saving || !name.trim() || !village}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full mt-8 bg-destructive/10 text-destructive rounded-xl p-4 flex items-center justify-center gap-2 font-semibold min-h-[48px]"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default Profile;
