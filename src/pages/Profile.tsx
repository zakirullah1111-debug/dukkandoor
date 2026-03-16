import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, MapPin } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span className="font-display text-2xl font-bold">{user?.name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user?.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-semibold text-sm">{user?.phone}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Village</p>
              <p className="font-semibold text-sm">{user?.village}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-destructive/10 text-destructive rounded-xl p-4 flex items-center justify-center gap-2 font-semibold min-h-[48px]"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </MobileLayout>
  );
};

export default Profile;
