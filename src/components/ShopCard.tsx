import { Shop } from '@/types';
import { Star, Clock, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopCard = ({ shop }: { shop: Shop }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/shop/${shop.id}`)}
      className="bg-card rounded-xl border border-border p-4 w-full text-left active:scale-[0.98] transition-transform animate-fade-in"
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
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              shop.is_open ? 'bg-green-light text-accent' : 'bg-muted text-muted-foreground'
            }`}>
              {shop.is_open ? 'Open' : 'Closed'}
            </span>
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
          </div>
        </div>
      </div>
    </button>
  );
};

export default ShopCard;
