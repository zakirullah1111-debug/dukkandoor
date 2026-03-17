import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import ShopCard from '@/components/ShopCard';
import ProductCard from '@/components/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Favorites = () => {
  const { session } = useAuth();
  const [favShops, setFavShops] = useState<any[]>([]);
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const fetch = async () => {
      const { data: favs } = await (supabase as any).from('favorites').select('*').eq('customer_id', session.user.id);
      if (!favs) { setLoading(false); return; }

      const shopIds = favs.filter((f: any) => f.shop_id).map((f: any) => f.shop_id);
      const productIds = favs.filter((f: any) => f.product_id).map((f: any) => f.product_id);

      const [shopsRes, productsRes] = await Promise.all([
        shopIds.length > 0 ? (supabase as any).from('shops').select('*').in('id', shopIds) : { data: [] },
        productIds.length > 0 ? (supabase as any).from('products').select('*').in('id', productIds) : { data: [] },
      ]);
      setFavShops(shopsRes.data || []);
      setFavProducts(productsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [session]);

  if (loading) return <MobileLayout><div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold mb-4">Favorites</h1>
        <Tabs defaultValue="shops">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="shops" className="flex-1">Shops</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
          </TabsList>
          <TabsContent value="shops">
            {favShops.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No favorite shops yet — tap ♡ on any shop!</p>
              </div>
            ) : (
              <div className="space-y-3">{favShops.map(s => <ShopCard key={s.id} shop={s} />)}</div>
            )}
          </TabsContent>
          <TabsContent value="products">
            {favProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No favorite products yet — tap ♡ on any product!</p>
              </div>
            ) : (
              <div className="space-y-2">{favProducts.map(p => <ProductCard key={p.id} product={p} shopId={p.shop_id} />)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Favorites;
