import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Monitor, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminLogin = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        toast.error('Unauthorized access — admin only');
        setLoading(false);
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f1624 50%, #0a0e1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,140,50,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,140,50,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255,100,30,0.08) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: '250px', height: '250px',
        background: 'radial-gradient(circle, rgba(255,140,50,0.06) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)',
      }} />

      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(255,140,50,0.15)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,140,50,0.2)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          color: '#ff8c32', fontSize: '12px', fontFamily: 'system-ui, sans-serif',
        }}>
          <Monitor size={14} />
          Admin dashboard is optimized for desktop
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          {/* Logo mark */}
          <div style={{
            width: '64px', height: '64px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(255,140,50,0.2), rgba(255,80,20,0.1))',
            border: '1px solid rgba(255,140,50,0.3)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255,100,30,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#ff8c32" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 2v20M3 7l9 5 9-5" stroke="#ff8c32" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Eyebrow text */}
          <p style={{
            fontSize: '11px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#ff8c32',
            marginBottom: '12px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
          }}>
            DukkanDoor
          </p>

          {/* Main heading */}
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            margin: '0 0 10px',
            letterSpacing: '-1px',
          }}>
            Admin Portal
          </h1>

          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.3px',
          }}>
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleLogin} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '36px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>

          {/* Email field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '10px',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 500,
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@dukkandoor.app"
              autoComplete="email"
              style={{
                width: '100%',
                height: '52px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '0 16px',
                color: '#ffffff',
                fontSize: '15px',
                fontFamily: 'system-ui, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255,140,50,0.5)';
                e.target.style.background = 'rgba(255,255,255,0.07)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '10px',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 500,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  height: '52px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '0 48px 0 16px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontFamily: 'system-ui, sans-serif',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(255,140,50,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: '4px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '52px',
              background: loading
                ? 'rgba(255,140,50,0.3)'
                : 'linear-gradient(135deg, #ff8c32 0%, #e06820 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(255,100,30,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(255,100,30,0.45)';
                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,100,30,0.3)';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.15)',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.5px',
        }}>
          DukkanDoor © {new Date().getFullYear()} · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
