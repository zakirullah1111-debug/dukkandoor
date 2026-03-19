import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const hotelTypes = ['Hotel', 'Dhaba', 'Home Kitchen', 'Food Stall'];
const prepTimes = [10, 15, 20, 30, 45];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultHours = days.reduce((acc, d) => ({ ...acc, [d]: { open: true, openTime: '08:00', closeTime: '22:00' } }), {} as any);

const HotelSetup = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [hotelName, setHotelName] = useState('');
  const [hotelType, setHotelType] = useState('Hotel');
  const [village, setVillage] = useState(user?.village || '');
  const [address, setAddress] = useState('');
  // Step 2
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  // Step 3
  const [prepTime, setPrepTime] = useState(15);
  const [businessHours, setBusinessHours] = useState<any>(defaultHours);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleFinish = async () => {
    if (!session?.user || !hotelName.trim()) return;
    setSaving(true);
    try {
      let logoUrl = '';
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('hotel-images').upload(path, logoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('hotel-images').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      await (supabase as any).from('hotel_profiles').insert({
        user_id: session.user.id,
        hotel_name: hotelName.trim(),
        hotel_type: hotelType,
        village: village.trim(),
        address: address.trim(),
        logo_url: logoUrl,
        prep_time_minutes: prepTime,
        business_hours: businessHours,
        is_open: false,
      });

      toast.success(t('success'));
      navigate('/hotel', { replace: true });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-6 pt-8 animate-fade-in">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">{t('setup_hotel')}</h1>
          <p className="text-muted-foreground mb-6">{t('setup_hotel_desc')}</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('hotel_name')} *</label>
              <Input value={hotelName} onChange={e => setHotelName(e.target.value)} className="h-14 rounded-xl text-base" placeholder="e.g. Khan's Dhaba" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('hotel_type')}</label>
              <Select value={hotelType} onValueChange={setHotelType}>
                <SelectTrigger className="h-14 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hotelTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('your_village')}</label>
              <Input value={village} onChange={e => setVillage(e.target.value)} className="h-14 rounded-xl text-base" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('address')}</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} className="h-14 rounded-xl text-base" placeholder="Street / landmark" />
            </div>
          </div>
          <Button onClick={() => setStep(2)} disabled={!hotelName.trim()} className="w-full h-14 text-base font-display font-semibold rounded-xl mt-6">
            {t('continue')} <ChevronRight className="w-5 h-5 ms-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">{t('upload_hotel_photo')}</h1>
          <p className="text-muted-foreground mb-6">{t('photo_trust')}</p>
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
              {logoPreview ? <img src={logoPreview} alt="Hotel" className="w-full h-full object-cover" /> : <Upload className="w-10 h-10 text-muted-foreground" />}
            </div>
            <label className="text-primary font-semibold cursor-pointer text-sm">
              {t('upload_photo')}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="text-sm text-muted-foreground py-3">{t('skip_for_now')}</button>
            <Button onClick={() => setStep(3)} className="flex-1 h-14 text-base font-display font-semibold rounded-xl">
              {t('continue')} <ChevronRight className="w-5 h-5 ms-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">{t('prep_time_hours')}</h1>
          <div className="mb-6">
            <label className="text-sm font-medium mb-1.5 block">{t('prep_time')}</label>
            <Select value={String(prepTime)} onValueChange={v => setPrepTime(Number(v))}>
              <SelectTrigger className="h-14 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {prepTimes.map(t => <SelectItem key={t} value={String(t)}>{t} mins</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium">{t('business_hours')}</label>
            {days.map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium capitalize">{day.slice(0, 3)}</span>
                <Switch checked={businessHours[day]?.open ?? true} onCheckedChange={v => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: v } }))} />
                {businessHours[day]?.open !== false && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <Input type="time" value={businessHours[day]?.openTime || '08:00'} onChange={e => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], openTime: e.target.value } }))} className="h-9 rounded-lg text-xs" />
                    <span className="text-xs text-muted-foreground">→</span>
                    <Input type="time" value={businessHours[day]?.closeTime || '22:00'} onChange={e => setBusinessHours((prev: any) => ({ ...prev, [day]: { ...prev[day], closeTime: e.target.value } }))} className="h-9 rounded-lg text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleFinish} disabled={saving} className="w-full h-14 text-base font-display font-semibold rounded-xl">
            {saving ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : null}
            {t('enter_dashboard')} →
          </Button>
        </div>
      )}
    </div>
  );
};

export default HotelSetup;
