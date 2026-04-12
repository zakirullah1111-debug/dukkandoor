import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LayoutDashboard, Package, Users, Store, Bike, MapPin, AlertTriangle, Bell, BarChart3, Settings, LogOut, Menu, X, Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Orders', icon: Package, path: '/admin/orders' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Shops & Hotels', icon: Store, path: '/admin/shops' },
  { label: 'Riders', icon: Bike, path: '/admin/riders' },
  { label: 'Villages', icon: MapPin, path: '/admin/villages', badge: 'villages' },
  { label: 'Reports', icon: AlertTriangle, path: '/admin/reports', badge: 'reports' },
  { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [badges, setBadges] = useState({ villages: 0, reports: 0 });
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-logout after 2 hours inactivity
  const resetActivity = useCallback(() => setLastActivity(Date.now()), []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity));
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 2 * 60 * 60 * 1000) {
        logout().then(() => navigate('/admin', { replace: true }));
      }
    }, 60000);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [lastActivity, logout, navigate, resetActivity]);

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      const [villagesRes, reportsRes] = await Promise.all([
        (supabase as any).from('villages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        (supabase as any).from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setBadges({
        villages: villagesRes.count || 0,
        reports: reportsRes.count || 0,
      });
    };
    fetchBadges();
  }, [location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!session || !user || user.role !== 'admin') {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-warning/90 text-warning-foreground text-xs text-center py-1.5 px-4 z-[60] flex items-center justify-center gap-1.5">
          <Monitor className="w-3 h-3" /> Optimized for desktop
        </div>
      )}

      {/* Sidebar overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-[#1a1f36] text-white z-50 transition-all duration-300 flex flex-col",
        sidebarOpen ? 'w-60' : (isMobile ? 'w-0 overflow-hidden' : 'w-16'),
        isMobile && 'mt-7'
      )}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && <span className="font-bold text-sm">🚪 DukkanDoor</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/70 hover:text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : 0;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative",
                  isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}>
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {badgeCount > 0 && (
                  <span className={cn(
                    "absolute text-[10px] font-bold text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center",
                    item.badge === 'reports' ? 'bg-destructive' : 'bg-warning',
                    sidebarOpen ? 'right-3' : 'top-1 right-1'
                  )}>{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          {sidebarOpen && <p className="text-xs text-white/50 mb-2 truncate">{user.name || 'Admin'}</p>}
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white w-full">
            <LogOut className="w-4 h-4" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        sidebarOpen ? (isMobile ? 'ml-0' : 'ml-60') : (isMobile ? 'ml-0' : 'ml-16'),
        isMobile && 'mt-7'
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3" style={isMobile ? { marginTop: 0 } : {}}>
          {(isMobile && !sidebarOpen) && (
            <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-gray-600" /></button>
          )}
          <h2 className="font-semibold text-gray-800 text-sm capitalize">
            {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </h2>
        </header>

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
