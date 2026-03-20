import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminLogin = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#1a1f36] flex items-center justify-center p-4">
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-warning/90 text-warning-foreground text-xs text-center py-2 px-4 z-50 flex items-center justify-center gap-2">
          <Monitor className="w-3.5 h-3.5" />
          Admin dashboard is optimized for desktop
        </div>
      )}
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">DukkanDoor Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Platform Management Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@dukkandoor.app" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
