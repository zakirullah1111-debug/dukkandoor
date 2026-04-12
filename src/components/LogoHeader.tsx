import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import dukkandoorLogo from '@/assets/dukkandoor-logo.png';

const LogoHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) { navigate('/'); return; }
    const routes: Record<string, string> = {
      customer: '/home', shopkeeper: '/shopkeeper', rider: '/rider',
      admin: '/admin/dashboard', farmer: '/farmer', hotel: '/hotel',
    };
    navigate(routes[user.role] || '/home');
  };

  return (
    <button onClick={handleClick} className="flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform">
      <img src={dukkandoorLogo} alt="DukkanDoor" className="h-8 w-auto" />
    </button>
  );
};

export default LogoHeader;
