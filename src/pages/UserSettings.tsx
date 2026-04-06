import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Moon, Sun, Trash2, Globe, ChevronRight, Shield, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [deleting, setDeleting] = useState(false);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dukkandoor_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dukkandoor_theme', 'light');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t('logout'));
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!session?.user) return;
    setDeleting(true);
    try {
      // Delete profile data (cascades will handle related data)
      await (supabase as any).from('profiles').delete().eq('id', session.user.id);
      await supabase.auth.signOut();
      toast.success(language === 'ur' ? 'اکاؤنٹ حذف ہو گیا' : 'Account deleted');
      navigate('/', { replace: true });
    } catch {
      toast.error(t('error_retry'));
    }
    setDeleting(false);
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'customer': return '/home';
      case 'shopkeeper': return '/shopkeeper';
      case 'rider': return '/rider';
      case 'farmer': return '/farmer';
      case 'hotel': return '/hotel';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(getDashboardPath())} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold">{t('settings')}</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Profile Section */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <span className="font-display text-xl font-bold">{user?.name?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role} • {user?.village}</p>
            </div>
            <button onClick={() => navigate('/profile')} className="text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ur' ? 'ظاہری شکل' : 'Appearance'}
            </p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <span className="text-sm font-medium">{language === 'ur' ? 'ڈارک موڈ' : 'Dark Mode'}</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ur' ? 'زبان' : 'Language'}
            </p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{language === 'ur' ? 'زبان' : 'Language'}</span>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="flex items-center h-8 rounded-full border border-border bg-background overflow-hidden text-xs font-semibold"
            >
              <span className={`px-2.5 py-1 transition-colors ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>EN</span>
              <span className={`px-2.5 py-1 transition-colors ${language === 'ur' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>اردو</span>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ur' ? 'اکاؤنٹ' : 'Account'}
            </p>
          </div>
          {/* Edit Profile */}
          <button onClick={() => navigate('/profile')} className="w-full px-4 py-3.5 flex items-center justify-between border-b border-border active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{language === 'ur' ? 'پروفائل دیکھیں' : 'View Profile'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {/* Logout */}
          <button onClick={handleLogout} className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors">
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">{t('logout')}</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-xl border border-destructive/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-destructive/20">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
              {language === 'ur' ? 'خطرناک زون' : 'Danger Zone'}
            </p>
          </div>
          <div className="p-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{language === 'ur' ? 'اکاؤنٹ حذف کریں' : 'Delete Account'}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{language === 'ur' ? 'کیا آپ واقعی اکاؤنٹ حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete your account?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ur'
                      ? 'یہ عمل واپس نہیں ہو سکتا۔ آپ کا تمام ڈیٹا مستقل طور پر حذف ہو جائے گا۔'
                      : 'This action cannot be undone. All your data will be permanently deleted.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? '...' : language === 'ur' ? 'ہاں، حذف کریں' : 'Yes, Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">DukkanDoor v1.0</p>
          <p className="text-[10px] text-muted-foreground mt-1">{language === 'ur' ? 'آپ کے گاؤں کی مارکیٹ، آپ کے دروازے تک' : 'Your village market, at your doorstep'}</p>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
