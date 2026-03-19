import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Phone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FarmerHomePickup = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [itemsDesc, setItemsDesc] = useState('');
  // Step 2
  const [selectedContact, setSelectedContact] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  // Step 3 — uses saved farm location
  // Step 4
  const [fee, setFee] = useState(80);
  const [urgent, setUrgent] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    (supabase as any).from('farmer_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }: any) => {
        setFarmerProfile(data);
        if (data?.saved_contacts?.length > 0) {
          setSelectedContact(data.saved_contacts[0].phone);
        }
        setLoading(false);
      });
  }, [session]);

  const contactNumber = showCustom ? customPhone : selectedContact;

  // Haversine distance for fee suggestion
  const suggestFee = () => {
    // Default suggestion
    return { min: 50, max: 100 };
  };

  const handlePlaceOrder = async () => {
    if (!session?.user || !contactNumber) return;
    setPlacing(true);
    try {
      const { data: order, error } = await (supabase as any).from('orders').insert({
        customer_id: session.user.id,
        shop_id: session.user.id, // Self-reference for home pickup
        order_type: 'home_pickup',
        items_description: itemsDesc.trim(),
        home_contact_number: contactNumber,
        farmer_offered_fee: fee,
        delivery_fee: fee,
        total_amount: fee,
        delivery_address: farmerProfile?.farm_landmark || 'Farm Location',
        delivery_lat: farmerProfile?.farm_lat,
        delivery_lng: farmerProfile?.farm_lng,
        urgent,
        status: 'placed',
        fee_acceptance_deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select().single();

      if (error) throw error;
      toast.success(t('success'));
      navigate('/order-tracking', { state: { orderId: order.id } });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setPlacing(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const suggestion = suggestFee();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">🏠 {t('get_from_home')}</h1>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-2">{t('what_need_from_home')}</h2>
          <Textarea
            value={itemsDesc}
            onChange={e => setItemsDesc(e.target.value)}
            placeholder={t('items_desc_placeholder')}
            className="rounded-xl text-base min-h-[120px]"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground mt-1 text-end">{itemsDesc.length}/300</p>
          <Button onClick={() => setStep(2)} disabled={!itemsDesc.trim()} className="w-full h-14 text-base font-display font-semibold rounded-xl mt-4">
            {t('continue')} →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-2">{t('who_call_home')}</h2>
          <div className="space-y-2 mb-4">
            {(farmerProfile?.saved_contacts || []).map((c: any, i: number) => (
              <button key={i}
                onClick={() => { setSelectedContact(c.phone); setShowCustom(false); }}
                className={`w-full rounded-xl border-2 p-4 text-start min-h-[56px] flex items-center gap-3 ${
                  !showCustom && selectedContact === c.phone ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{c.label}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowCustom(true)} className="text-sm text-primary font-semibold mb-3">{t('enter_different_number')}</button>
          {showCustom && (
            <Input type="tel" placeholder="03XX XXXXXXX" value={customPhone} onChange={e => setCustomPhone(e.target.value)}
              className="h-14 rounded-xl text-base mb-4" maxLength={11} />
          )}
          <Button onClick={() => setStep(3)} disabled={!contactNumber} className="w-full h-14 text-base font-display font-semibold rounded-xl">
            {t('continue')} →
          </Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-2">{t('delivery_location')}</h2>
          {farmerProfile?.farm_lat ? (
            <div className="bg-accent/10 rounded-xl border-2 border-accent/30 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-semibold text-sm">{t('your_saved_farm')}</span>
              </div>
              {farmerProfile.farm_landmark && <p className="text-sm text-muted-foreground">📍 {farmerProfile.farm_landmark}</p>}
              <p className="text-xs text-accent mt-1">✅ {t('use_this_location')}</p>
            </div>
          ) : (
            <div className="bg-warning/10 rounded-xl border border-warning/20 p-4 mb-4">
              <p className="text-sm text-warning font-semibold">{t('no_farm_location')}</p>
              <p className="text-xs text-muted-foreground">{t('save_farm_first')}</p>
            </div>
          )}
          <Button onClick={() => setStep(4)} className="w-full h-14 text-base font-display font-semibold rounded-xl">
            {t('continue')} →
          </Button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-2">{t('set_delivery_fee')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('riders_see_fee')}</p>
          <p className="text-xs text-accent mb-4">💡 {t('suggested_range')}: PKR {suggestion.min} – {suggestion.max}</p>

          <div className="relative mb-4">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
            <Input type="number" value={fee} onChange={e => setFee(Number(e.target.value))}
              className="h-14 ps-14 rounded-xl text-2xl font-display font-bold text-center" />
          </div>

          <div className="flex gap-2 mb-6">
            {[50, 80, 100, 150].map(f => (
              <button key={f} onClick={() => setFee(f)}
                className={`flex-1 rounded-xl border-2 p-3 text-center font-display font-bold text-sm min-h-[48px] ${fee === f ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}>
                PKR {f}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-sm">{t('mark_urgent')} 🚨</p>
                <p className="text-xs text-muted-foreground">{t('urgent_desc')}</p>
              </div>
            </div>
            <Switch checked={urgent} onCheckedChange={setUrgent} />
          </div>

          <Button onClick={handlePlaceOrder} disabled={placing || fee < 10} className="w-full h-14 text-base font-display font-semibold rounded-xl">
            {placing ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : null}
            {t('place_order')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FarmerHomePickup;
