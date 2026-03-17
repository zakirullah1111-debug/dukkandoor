import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteButtonProps {
  shopId?: string;
  productId?: string;
  className?: string;
}

const FavoriteButton = ({ shopId, productId, className = '' }: FavoriteButtonProps) => {
  const { session } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const check = async () => {
      let query = (supabase as any).from('favorites').select('id').eq('customer_id', session.user.id);
      if (shopId) query = query.eq('shop_id', shopId);
      if (productId) query = query.eq('product_id', productId);
      const { data } = await query.maybeSingle();
      if (data) { setIsFav(true); setFavId(data.id); }
    };
    check();
  }, [session, shopId, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!session?.user) return;

    if (isFav && favId) {
      await (supabase as any).from('favorites').delete().eq('id', favId);
      setIsFav(false);
      setFavId(null);
    } else {
      const { data } = await (supabase as any).from('favorites').insert({
        customer_id: session.user.id,
        shop_id: shopId || null,
        product_id: productId || null,
      }).select('id').single();
      if (data) { setIsFav(true); setFavId(data.id); }
    }
  };

  return (
    <button onClick={toggle} className={`p-1.5 ${className}`}>
      <Heart className={`w-5 h-5 transition-colors ${isFav ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
    </button>
  );
};

export default FavoriteButton;
