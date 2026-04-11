import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const roleLabels: Record<string, string> = {
  customer: 'Customer',
  shopkeeper: 'Shopkeeper',
  rider: 'Delivery Rider',
  farmer: 'Farmer',
  hotel: 'Hotel Owner',
};

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
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [roleMismatchError, setRoleMismatchError] = useState('');

  const handleSendOtp = async () => {
    if (phone.replace(/\s/g, '').length < 10) return;
    setLoading(true);
    setRoleMismatchError('');
    try {
      const clean = phone.replace(/\s/g, '');
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('phone', clean)
        .maybeSingle();
      setIsReturningUser(!!data);
    } catch {
      setIsReturningUser(false);
    }
    setTimeout(() => { setStep('otp'); setLoading(false); }, 800);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    setLoading(true);
    setRoleMismatchError('');
    try {
      const clean = phone.replace(/\s/g, '');

      // Check existing role BEFORE calling signUp
      const { data: existingProfile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('phone', clean)
        .maybeSingle();

      if (existingProfile && existingProfile.role !== role) {
        const existingRoleLabel = roleLabels[existingProfile.role] || existingProfile.role;
        setRoleMismatchError(
          `This number is already registered as a ${existingRoleLabel}. Please go back and select "${existingRoleLabel}" to continue.`
        );
        setLoading(false);
        return;
      }

      // No mismatch — proceed exactly as before
      await signUp(phone, role);
      toast.success(isReturningUser ? 'Welcome back!' : 'Welcome to DukkanDoor!');
      navigate('/setup', { replace: true });
    } catch (err: any) {
      toast.error(err.message || t('error_retry'));
    } finally {
      setLoading(false);
    }
  };

  const t_roleLabels: Record<string, string> = {
    customer: t('customer'),
    shopkeeper: t('shopkeeper'),
    rider: t('delivery_rider'),
    farmer: t('farmer'),
    hotel: t('hotel_owner'),
  };

  const getSubtitle = () => {
    if (step === 'otp') return `${t('we_sent_code')} ${phone}`;
    if (isReturningUser) return `Welcome back! Logging you in as ${t_roleLabels[role] || role}`;
    return `${t('signing_up_as')} ${t_roleLabels[role] || role}`;
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
          {step === 'phone'
            ? (isReturningUser ? 'Welcome Back!' : t('enter_phone'))
            : t('enter_otp')}
        </h1>
        <p className="text-muted-foreground mt-1">{getSubtitle()}</p>

        <div className="mt-8 space-y-4">
          {step === 'phone' ? (
            <>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="03XX XXXXXXX"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setIsReturningUser(false);
                    setRoleMismatchError('');
                  }}
                  className="h-14 text-lg ps-11 rounded-xl"
                  maxLength={11}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={phone.replace(/\s/g, '').length < 10 || loading}
                className="w-full h-14 text-base font-display font-semibold rounded-xl"
              >
                {loading ? t('sending') : t('send_otp')}
              </Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={e => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setRoleMismatchError('');
                }}
                className="h-14 text-2xl text-center tracking-[0.5em] rounded-xl font-display"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground text-center">{t('mvp_hint')}</p>

              {/* Role mismatch error */}
              {roleMismatchError ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Wrong account type</p>
                    <p className="text-sm text-destructive/80 mt-1">{roleMismatchError}</p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-2 text-sm font-bold text-destructive underline underline-offset-2"
                    >
                      ← Go back to select correct role
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 4 || loading}
                  className="w-full h-14 text-base font-display font-semibold rounded-xl"
                >
                  {loading ? t('verifying') : t('verify_continue')}
                </Button>
              )}

              <button
                onClick={() => { setStep('phone'); setOtp(''); setRoleMismatchError(''); }}
                className="w-full text-sm text-muted-foreground text-center py-2 min-h-[40px]"
              >
                ← Change phone number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
