import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as { role: string })?.role || 'customer';
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.replace(/\s/g, '').length < 10) return;
    setLoading(true);
    setTimeout(() => { setStep('otp'); setLoading(false); }, 800);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    setLoading(true);
    try {
      await signUp(phone, role);
      toast.success('Welcome to DukkanDoor!');
      navigate('/setup', { replace: true });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally { setLoading(false); }
  };

  const roleLabels: Record<string, string> = {
    customer: t('customer'), shopkeeper: t('shopkeeper'), rider: t('delivery_rider'),
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ms-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <LanguageToggle />
      </div>
      <div className="mt-8 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">
          {step === 'phone' ? t('enter_phone') : t('enter_otp')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === 'phone' ? `${t('signing_up_as')} ${roleLabels[role] || role}` : `${t('we_sent_code')} ${phone}`}
        </p>
        <div className="mt-8 space-y-4">
          {step === 'phone' ? (
            <>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="tel" placeholder="03XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="h-14 text-lg ps-11 rounded-xl" maxLength={11} />
              </div>
              <Button onClick={handleSendOtp} disabled={phone.replace(/\s/g, '').length < 10 || loading} className="w-full h-14 text-base font-display font-semibold rounded-xl">
                {loading ? t('sending') : t('send_otp')}
              </Button>
            </>
          ) : (
            <>
              <Input type="text" placeholder="Enter 4-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} className="h-14 text-2xl text-center tracking-[0.5em] rounded-xl font-display" maxLength={4} />
              <p className="text-xs text-muted-foreground text-center">{t('mvp_hint')}</p>
              <Button onClick={handleVerifyOtp} disabled={otp.length < 4 || loading} className="w-full h-14 text-base font-display font-semibold rounded-xl">
                {loading ? t('verifying') : t('verify_continue')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
