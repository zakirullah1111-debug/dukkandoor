import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categories = ['Grocery', 'Bakery', 'Pharmacy', 'Vegetables', 'General Store', 'Electronics'];

const ShopSetup = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [village, setVillage] = useState(user?.village || '');
  const [address, setAddress] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!shopName.trim() || !category || !session?.user) return;
    setSaving(true);
    try {
      let logoUrl = '';
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('shop-images').upload(path, logoFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('shop-images').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { error } = await (supabase as any).from('shops').insert({
        owner_id: session.user.id,
        shop_name: shopName.trim(),
        category,
        village: village || user?.village || '',
        address: address.trim(),
        logo_url: logoUrl,
        description: '',
        is_open: true,
      });
      if (error) throw error;

      toast.success('Shop created successfully!');
      navigate('/shopkeeper', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shop');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-8 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
          <Store className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Set Up Your Shop</h1>
          <p className="text-sm text-muted-foreground">Tell customers about your shop</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
            {logoPreview ? (
              <img src={logoPreview} alt="Shop logo" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <label className="text-sm text-primary font-medium cursor-pointer">
            Upload Shop Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Shop Name *</label>
          <Input value={shopName} onChange={e => setShopName(e.target.value)} className="h-12 rounded-xl" placeholder="e.g., Al-Baraka General Store" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Category *</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Village / Area</label>
          <Input value={village} onChange={e => setVillage(e.target.value)} className="h-12 rounded-xl" placeholder="Your village" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Shop Address</label>
          <Input value={address} onChange={e => setAddress(e.target.value)} className="h-12 rounded-xl" placeholder="Street / landmark" />
        </div>

        <Button onClick={handleSubmit} disabled={!shopName.trim() || !category || saving} className="w-full h-14 text-base font-display font-semibold rounded-xl">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</> : 'Save & Continue to Dashboard'}
        </Button>
      </div>
    </div>
  );
};

export default ShopSetup;
