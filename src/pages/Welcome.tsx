import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Bike, Wheat, UtensilsCrossed, Store } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff8f3' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea580c' }} />
    </div>
  );
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      background: 'linear-gradient(170deg, #fff8f3 0%, #ffeedd 40%, #fff5ec 100%)',
    }}>

      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.1) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '80px', left: '-80px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.07) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.05) 0%, transparent 70%)',
        }} />
        {/* Subtle dot grid */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.3 }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(234,88,12,0.2)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 end-4 z-20">
        <LanguageToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-between px-5 pt-10 pb-6 max-w-sm mx-auto w-full relative z-10">

        {/* TOP — Logo + trust badges */}
        <div className="flex flex-col items-center w-full">

          {/* Logo image — no duplicate text needed, logo has it all */}
          <div className="animate-fade-in" style={{ marginBottom: '12px' }}>
            <img
              src="/logo.png"
              alt="DukkanDoor"
              style={{
                width: '220px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px rgba(234,88,12,0.15))',
              }}
            />
          </div>

          {/* Trust badges row */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '28px',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {[
              { emoji: '⚡', text: 'Fast Delivery' },
              { emoji: '🏘️', text: 'Local Shops' },
              { emoji: '🔒', text: 'Secure' },
            ].map(badge => (
              <div key={badge.text} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(234,88,12,0.15)',
                borderRadius: '100px',
                padding: '4px 10px',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: '11px' }}>{badge.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#78716c' }}>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE — Role selection */}
        <div className="w-full">
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(234,88,12,0.15)' }} />
            <p style={{
              fontSize: '11px', fontWeight: 700, color: '#b45309',
              letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              Get Started As
            </p>
            <div style={{ flex: 1, height: '1px', background: 'rgba(234,88,12,0.15)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Customer — hero button */}
            <button
              onClick={() => navigate('/auth', { state: { role: 'customer' } })}
              className="animate-fade-in"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                border: 'none', borderRadius: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px', cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(234,88,12,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
                transition: 'transform 0.15s, box-shadow 0.15s',
                animationDelay: '0.05s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(234,88,12,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(234,88,12,0.35)';
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ShoppingBag style={{ width: '22px', height: '22px', color: 'white' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ color: 'white', fontSize: '16px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
                  {t('i_want_to_order')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px', margin: '2px 0 0' }}>
                  Browse local shops · Get it delivered
                </p>
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: '14px',
              }}>
                →
              </div>
            </button>

            {/* Business roles row — 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

              {/* Shopkeeper */}
              <button
                onClick={() => navigate('/auth', { state: { role: 'shopkeeper' } })}
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1.5px solid rgba(234,88,12,0.15)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 10px', cursor: 'pointer', gap: '8px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(234,88,12,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(234,88,12,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(234,88,12,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(234,88,12,0.12)',
                }}>
                  <Store style={{ width: '22px', height: '22px', color: '#ea580c' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Shopkeeper</p>
                  <p style={{ fontSize: '10px', color: '#a8a29e', margin: '2px 0 0' }}>Manage your shop</p>
                </div>
              </button>

              {/* Farmer */}
              <button
                onClick={() => navigate('/auth', { state: { role: 'farmer' } })}
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1.5px solid rgba(22,163,74,0.15)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 10px', cursor: 'pointer', gap: '8px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(22,163,74,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(22,163,74,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(22,163,74,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.12)',
                }}>
                  <Wheat style={{ width: '22px', height: '22px', color: '#16a34a' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Farmer 🌾</p>
                  <p style={{ fontSize: '10px', color: '#a8a29e', margin: '2px 0 0' }}>Order & pickup</p>
                </div>
              </button>
            </div>

            {/* Hotel — full width */}
            <button
              onClick={() => navigate('/auth', { state: { role: 'hotel' } })}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.85)',
                border: '1.5px solid rgba(234,88,12,0.15)',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px', cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(234,88,12,0.4)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(234,88,12,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(234,88,12,0.15)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(234,88,12,0.12)',
              }}>
                <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#ea580c' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: 0 }}>
                  {t('im_hotel')}
                </p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: '2px 0 0' }}>
                  List your menu · Receive orders
                </p>
              </div>
            </button>

            {/* Rider — subtle */}
            <button
              onClick={() => navigate('/auth', { state: { role: 'rider' } })}
              style={{
                width: '100%', minHeight: '44px',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                cursor: 'pointer', padding: '6px',
              }}
            >
              <Bike style={{ width: '14px', height: '14px', color: '#a8a29e' }} />
              <span style={{
                fontSize: '13px', color: '#78716c', fontWeight: 500,
                borderBottom: '1px dashed #d6d3d1', paddingBottom: '1px',
              }}>
                {t('join_rider')} — Earn money delivering
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM — footer */}
        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <p style={{ fontSize: '11px', color: '#c4b5a5' }}>
            Proudly serving local communities 🇵🇰
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
