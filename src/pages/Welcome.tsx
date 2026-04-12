import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Bike, Wheat, UtensilsCrossed, DoorOpen } from 'lucide-react';
import dukkandoorLogo from '@/assets/dukkandoor-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { Loader2 } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (!user?.name) { navigate('/setup', { replace: true }); return; }
    const routes: Record<string, string> = {
      customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider',
      admin: '/admin/dashboard', farmer: '/farmer', hotel: '/hotel',
    };
    navigate(routes[user.role] || '/home', { replace: true });
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(160deg, #fff8f3 0%, #fff3e8 50%, #fef9f5 100%)',
    }}>
      {/* Decorative top pattern */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-60px', left: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(234, 88, 12, 0.06)',
        }} />
        <div style={{
          position: 'absolute', top: '-30px', right: '-50px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(234, 88, 12, 0.05)',
        }} />
        <div style={{
          position: 'absolute', top: '40px', left: '30%',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(234, 88, 12, 0.04)',
        }} />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 end-4 z-10">
        <LanguageToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-sm mx-auto w-full">

        {/* Hero section */}
        <div className="flex flex-col items-center text-center mb-8 animate-fade-in">
          {/* Logo */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(234,88,12,0.25), 0 2px 8px rgba(234,88,12,0.15)',
          }}>
            <DoorOpen style={{ width: '44px', height: '44px', color: 'white' }} />
          </div>

          {/* App name */}
          <h1 style={{
            fontSize: '32px', fontWeight: 800,
            color: '#1a1a1a', letterSpacing: '-0.5px',
            marginBottom: '6px', lineHeight: 1.1,
          }}>
            DukkanDoor
          </h1>

          {/* Single tagline — fixed duplicate bug */}
          <p style={{
            fontSize: '15px', color: '#78716c',
            fontWeight: 400, lineHeight: 1.5,
            maxWidth: '220px',
          }}>
            {t('tagline')}
          </p>

          {/* Decorative divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginTop: '20px', marginBottom: '4px',
          }}>
            <div style={{ width: '28px', height: '1.5px', background: 'rgba(234,88,12,0.2)', borderRadius: '2px' }} />
            <span style={{ fontSize: '16px' }}>🏘️</span>
            <div style={{ width: '28px', height: '1.5px', background: 'rgba(234,88,12,0.2)', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Buttons section */}
        <div className="w-full space-y-2.5">

          {/* Section label */}
          <p style={{
            fontSize: '11px', fontWeight: 600,
            color: '#a8a29e', letterSpacing: '1.5px',
            textTransform: 'uppercase', textAlign: 'center',
            marginBottom: '4px',
          }}>
            Who are you?
          </p>

          {/* Customer — primary CTA */}
          <button
            onClick={() => navigate('/auth', { state: { role: 'customer' } })}
            style={{
              width: '100%', height: '60px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              border: 'none', borderRadius: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 20px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(234,88,12,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(234,88,12,0.3)';
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ShoppingBag style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>
                {t('i_want_to_order')}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '1px' }}>
                Browse shops & get delivery
              </p>
            </div>
          </button>

          {/* Shopkeeper */}
          <button
            onClick={() => navigate('/auth', { state: { role: 'shopkeeper' } })}
            style={{
              width: '100%', height: '56px',
              background: 'white',
              border: '1.5px solid #e7e5e4',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 20px', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#ea580c';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(234,88,12,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e7e5e4';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DoorOpen style={{ width: '17px', height: '17px', color: '#ea580c' }} />
            </div>
            <span style={{ color: '#1c1917', fontSize: '15px', fontWeight: 600 }}>
              {t('im_shopkeeper')}
            </span>
          </button>

          {/* Farmer */}
          <button
            onClick={() => navigate('/auth', { state: { role: 'farmer' } })}
            style={{
              width: '100%', height: '56px',
              background: 'white',
              border: '1.5px solid #e7e5e4',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 20px', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#16a34a';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(22,163,74,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e7e5e4';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Wheat style={{ width: '17px', height: '17px', color: '#16a34a' }} />
            </div>
            <span style={{ color: '#1c1917', fontSize: '15px', fontWeight: 600 }}>
              {t('im_farmer')}
            </span>
          </button>

          {/* Hotel */}
          <button
            onClick={() => navigate('/auth', { state: { role: 'hotel' } })}
            style={{
              width: '100%', height: '56px',
              background: 'white',
              border: '1.5px solid #e7e5e4',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 20px', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#ea580c';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(234,88,12,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e7e5e4';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UtensilsCrossed style={{ width: '17px', height: '17px', color: '#ea580c' }} />
            </div>
            <span style={{ color: '#1c1917', fontSize: '15px', fontWeight: 600 }}>
              {t('im_hotel')}
            </span>
          </button>

          {/* Rider — subtle link style */}
          <button
            onClick={() => navigate('/auth', { state: { role: 'rider' } })}
            style={{
              width: '100%', minHeight: '44px',
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              cursor: 'pointer', marginTop: '4px',
              padding: '8px',
            }}
          >
            <Bike style={{ width: '15px', height: '15px', color: '#a8a29e' }} />
            <span style={{
              fontSize: '13px', color: '#78716c', fontWeight: 500,
              borderBottom: '1px dashed #d6d3d1',
              paddingBottom: '1px',
            }}>
              {t('join_rider')}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{ textAlign: 'center', padding: '12px', paddingBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: '#c4b5a5', fontWeight: 400 }}>
          🔒 Safe · Fast · Local
        </p>
      </div>
    </div>
  );
};

export default Welcome;
