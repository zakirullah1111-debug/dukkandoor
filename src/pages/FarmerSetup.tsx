import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Users, Loader2, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Contact { label: string; phone: string; }

const FarmerSetup = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 - Farm Location
  const [farmLat, setFarmLat] = useState<number | null>(null);
  const [farmLng, setFarmLng] = useState<number | null>(null);
  const [farmLandmark, setFarmLandmark] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  // Step 3 - Contacts
  const [contacts, setContacts] = useState<Contact[]>([
    { label: 'Home 🏠', phone: '' },
    { label: '', phone: '' },
    { label: '', phone: '' },
  ]);

  const saveFarmLocation = async () => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return; }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true });
      });
      setFarmLat(pos.coords.latitude);
      setFarmLng(pos.coords.longitude);
      setLocationSaved(true);
      toast.success(t('success'));
    } catch { toast.error(t('error_retry')); }
    finally { setLocating(false); }
  };

  const handleFinish = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const validContacts = contacts.filter(c => c.phone.trim().length >= 10);
      await (supabase as any).from('farmer_profiles').insert({
        user_id: session.user.id,
        full_name: user?.name || '',
        farm_lat: farmLat,
        farm_lng: farmLng,
        farm_landmark: farmLandmark.trim() || null,
        saved_contacts: validContacts.length > 0 ? validContacts : [],
      });
      toast.success(t('success'));
      navigate('/farmer', { replace: true });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-6 pt-8 animate-fade-in">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">🌾</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">{t('welcome_farmer')}</h1>
          <p className="text-muted-foreground mb-8">{t('farmer_setup_desc')}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t('your_name')}: <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {t('your_village')}: <span className="font-semibold text-foreground">{user?.village}</span>
          </p>
          <Button onClick={() => setStep(2)} className="w-full h-14 text-base font-display font-semibold rounded-xl">
            {t('continue')} <ChevronRight className="w-5 h-5 ms-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">{t('save_farm_location')}</h1>
          <p className="text-muted-foreground mb-6">{t('save_farm_location_desc')}</p>

          <Button
            onClick={saveFarmLocation}
            disabled={locating}
            variant={locationSaved ? 'outline' : 'default'}
            className="w-full h-14 text-base font-display font-semibold rounded-xl mb-4 gap-2"
          >
            {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            {locationSaved ? `✅ ${t('farm_location_saved')}` : `📍 ${t('save_current_farm_location')}`}
          </Button>

          <div className="mb-6">
            <label className="text-sm font-medium mb-1.5 block">{t('describe_farm_location')}</label>
            <Input
              value={farmLandmark}
              onChange={e => setFarmLandmark(e.target.value)}
              placeholder={t('farm_landmark_placeholder')}
              className="h-14 rounded-xl text-base"
            />
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
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">{t('save_home_contacts')}</h1>
          <p className="text-muted-foreground mb-6">{t('save_home_contacts_desc')}</p>

          <div className="space-y-4 mb-6">
            {contacts.map((c, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3 space-y-2">
                <Input
                  placeholder={t('contact_label')}
                  value={c.label}
                  onChange={e => {
                    const next = [...contacts];
                    next[i] = { ...next[i], label: e.target.value };
                    setContacts(next);
                  }}
                  className="h-12 rounded-xl text-base"
                />
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="03XX XXXXXXX"
                    value={c.phone}
                    onChange={e => {
                      const next = [...contacts];
                      next[i] = { ...next[i], phone: e.target.value };
                      setContacts(next);
                    }}
                    className="h-12 ps-10 rounded-xl text-base"
                    maxLength={11}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { handleFinish(); }} className="text-sm text-muted-foreground py-3">{t('skip_for_now')}</button>
            <Button onClick={handleFinish} disabled={saving} className="flex-1 h-14 text-base font-display font-semibold rounded-xl gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {t('save_enter_dukkandoor')} 🌾
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerSetup;
