import { Shop } from '@/types';
import { Star, Clock, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

const ShopCard = ({ shop }: { shop: Shop }) => {
  const navigate = useNavigate();

  // Business hours check
  const isActuallyOpen = (() => {
    if (!shop.is_open) return false;
    if (!shop.business_hours) return shop.is_open;
    const bh = shop.business_hours as any;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    const daySchedule = bh[dayKey];
    if (!daySchedule || !daySchedule.open) return false;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (daySchedule.openTime || '09:00').split(':').map(Number);
    const [closeH, closeM] = (daySchedule.closeTime || '21:00').split(':').map(Number);
    return currentMin >= openH * 60 + openM && currentMin <= closeH * 60 + closeM;
  })();

  const getOpensAt = () => {
    if (!shop.business_hours) return null;
    const bh = shop.business_hours as any;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const dayKey = days[now.getDay()];
    const daySchedule = bh[dayKey];
    if (daySchedule?.open && daySchedule?.openTime) return daySchedule.openTime;
    return null;
  };

  return (
    <button
      onClick={() => navigate(`/shop/${shop.id}`)}
      className={`bg-card rounded-xl border border-border p-4 w-full text-left active:scale-[0.98] transition-transform animate-fade-in ${!isActuallyOpen ? 'opacity-70' : ''}`}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-orange-light flex items-center justify-center shrink-0 overflow-hidden">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-base truncate">{shop.shop_name}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <FavoriteButton shopId={shop.id} />
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isActuallyOpen ? 'bg-green-light text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                {isActuallyOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{shop.category}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {shop.rating && shop.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                <span className="text-xs font-semibold">{shop.rating}</span>
              </div>
            )}
            {shop.delivery_time && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{shop.delivery_time}</span>
              </div>
            )}
            {!isActuallyOpen && getOpensAt() && (
              <span className="text-xs text-muted-foreground">Opens at {getOpensAt()}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ShopCard;
