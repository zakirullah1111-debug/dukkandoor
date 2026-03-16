import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, ShoppingBag, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (!user?.name) {
      navigate('/setup', { replace: true });
      return;
    }
    const routes: Record<string, string> = { customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider', admin: '/admin' };
    navigate(routes[user.role] || '/home', { replace: true });
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="animate-scale-in flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <DoorOpen className="w-12 h-12 text-primary-foreground" />
        </div>

        <h1 className="font-display text-3xl font-bold mb-2">DukkanDoor</h1>
        <p className="text-lg font-semibold text-foreground mb-1" dir="rtl">
          آپ کے گاؤں کی مارکیٹ، آپ کے دروازے تک
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Your village market, at your doorstep
        </p>

        <div className="w-full space-y-3">
          <Button
            onClick={() => navigate('/auth', { state: { role: 'customer' } })}
            className="w-full h-14 text-base font-display font-semibold rounded-xl gap-3"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5" />
            I want to Order
          </Button>

          <Button
            onClick={() => navigate('/auth', { state: { role: 'shopkeeper' } })}
            variant="outline"
            className="w-full h-14 text-base font-display font-semibold rounded-xl gap-3 border-2"
            size="lg"
          >
            <DoorOpen className="w-5 h-5" />
            I'm a Shopkeeper
          </Button>

          <button
            onClick={() => navigate('/auth', { state: { role: 'rider' } })}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 py-3 w-full min-h-[44px]"
          >
            <Bike className="w-4 h-4" />
            Join as Delivery Rider
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
