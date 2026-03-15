import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as { role: UserRole })?.role || 'customer';
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      login(phone, role);
      setLoading(false);
      navigate('/setup');
    }, 800);
  };

  const roleLabels: Record<string, string> = {
    customer: 'Customer',
    shopkeeper: 'Shopkeeper',
    rider: 'Delivery Rider',
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-4">
      <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="mt-8 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">
          {step === 'phone' ? 'Enter your phone number' : 'Enter OTP'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === 'phone'
            ? `Signing up as ${roleLabels[role]}`
            : `We sent a code to ${phone}`}
        </p>

        <div className="mt-8 space-y-4">
          {step === 'phone' ? (
            <>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="03XX XXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-14 text-lg pl-11 rounded-xl"
                  maxLength={11}
                />
              </div>
              <Button onClick={handleSendOtp} disabled={phone.length < 10 || loading} className="w-full h-14 text-base font-display font-semibold rounded-xl">
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="h-14 text-2xl text-center tracking-[0.5em] rounded-xl font-display"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground text-center">For MVP, enter any 4 digits</p>
              <Button onClick={handleVerifyOtp} disabled={otp.length < 4 || loading} className="w-full h-14 text-base font-display font-semibold rounded-xl">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
