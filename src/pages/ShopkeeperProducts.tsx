import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { mockProducts } from '@/data/mockData';
import { useState } from 'react';

const ShopkeeperProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(mockProducts.filter(p => p.shop_id === 'shop-1'));

  const toggleStock = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !p.in_stock } : p));
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">My Products</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map(product => (
          <div key={product.id} className="bg-card rounded-xl border border-border p-3">
            <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-2">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="font-display font-bold text-sm">Rs {product.price}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-light text-accent' : 'bg-destructive/10 text-destructive'}`}>
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
              <button onClick={() => toggleStock(product.id)} className="text-xs text-primary font-medium min-h-[32px]">Toggle</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopkeeperProducts;
