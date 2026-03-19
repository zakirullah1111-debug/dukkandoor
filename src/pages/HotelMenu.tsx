import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks'];

const HotelMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [hotel, setHotel] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  const [addOpen, setAddOpen] = useState(false);

  // Add/Edit form
  const [editItem, setEditItem] = useState<any>(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCat, setDishCat] = useState('Lunch');
  const [dishAvailable, setDishAvailable] = useState(true);
  const [dishImage, setDishImage] = useState<File | null>(null);
  const [dishImagePreview, setDishImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const init = async () => {
      const { data: hotelData } = await (supabase as any).from('hotel_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!hotelData) { navigate('/hotel/setup', { replace: true }); return; }
      setHotel(hotelData);
      const { data: menuItems } = await (supabase as any).from('menu_items').select('*').eq('hotel_id', hotelData.id).order('created_at', { ascending: false });
      setItems(menuItems || []);
      setLoading(false);
      if ((location.state as any)?.openAdd) setAddOpen(true);
    };
    init();
  }, [session, navigate]);

  const resetForm = () => {
    setDishName(''); setDishDesc(''); setDishPrice(''); setDishCat('Lunch'); setDishAvailable(true); setDishImage(null); setDishImagePreview(''); setEditItem(null);
  };

  const openEditForm = (item: any) => {
    setEditItem(item);
    setDishName(item.name);
    setDishDesc(item.description || '');
    setDishPrice(String(item.price));
    setDishCat(item.category);
    setDishAvailable(item.is_available);
    setDishImagePreview(item.image_url || '');
    setAddOpen(true);
  };

  const handleSave = async () => {
    if (!hotel || !dishName.trim() || !dishPrice) return;
    setSaving(true);
    try {
      let imageUrl = editItem?.image_url || '';
      if (dishImage) {
        const ext = dishImage.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('menu-images').upload(path, dishImage);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const payload = {
        hotel_id: hotel.id,
        name: dishName.trim(),
        description: dishDesc.trim(),
        price: Number(dishPrice),
        category: dishCat,
        is_available: dishAvailable,
        image_url: imageUrl,
      };

      if (editItem) {
        await (supabase as any).from('menu_items').update(payload).eq('id', editItem.id);
        setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...payload } : i));
      } else {
        const { data } = await (supabase as any).from('menu_items').insert(payload).select().single();
        if (data) setItems(prev => [data, ...prev]);
      }
      toast.success(t('success'));
      setAddOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setSaving(false); }
  };

  const deleteDish = async (id: string) => {
    await (supabase as any).from('menu_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success(t('delete'));
  };

  const toggleAvailability = async (item: any) => {
    const newVal = !item.is_available;
    await (supabase as any).from('menu_items').update({ is_available: newVal }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newVal } : i));
  };

  const filtered = selectedCat === 'All' ? items : items.filter(i => i.category === selectedCat);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-bold">{t('manage_menu')}</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {['All', ...categories].map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCat === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('no_menu_items')}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xl">🍽️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    {!item.is_available && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">SOLD OUT</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="font-display font-bold text-sm mt-0.5">Rs {item.price}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => openEditForm(item)} className="text-xs text-primary font-semibold">{t('edit')}</button>
                    <button onClick={() => toggleAvailability(item)} className="text-xs text-muted-foreground">{item.is_available ? 'Mark Sold Out' : 'Mark Available'}</button>
                    <button onClick={() => deleteDish(item.id)} className="text-xs text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { resetForm(); setAddOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Sheet */}
      <Sheet open={addOpen} onOpenChange={v => { if (!v) resetForm(); setAddOpen(v); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader><SheetTitle className="font-display">{editItem ? t('edit_dish') : t('add_dish')}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                {dishImagePreview ? <img src={dishImagePreview} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
              </div>
              <label className="text-xs text-primary font-semibold cursor-pointer">
                {t('upload_photo')}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setDishImage(f); setDishImagePreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </div>
            <Input value={dishName} onChange={e => setDishName(e.target.value)} placeholder={t('dish_name')} className="h-12 rounded-xl" />
            <Textarea value={dishDesc} onChange={e => setDishDesc(e.target.value)} placeholder={t('dish_desc')} className="rounded-xl text-sm" />
            <Select value={dishCat} onValueChange={setDishCat}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" value={dishPrice} onChange={e => setDishPrice(e.target.value)} placeholder={t('price')} className="h-12 rounded-xl" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('available')}</span>
              <Switch checked={dishAvailable} onCheckedChange={setDishAvailable} />
            </div>
            <Button onClick={handleSave} disabled={saving || !dishName.trim() || !dishPrice} className="w-full h-12 rounded-xl font-display">
              {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {editItem ? t('save') : t('add_dish')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HotelMenu;
