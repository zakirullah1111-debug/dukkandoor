import { Product } from '@/types';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const ProductCard = ({ product, shopId }: { product: Product; shopId: string }) => {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find(i => i.product.id === product.id);
  const discountedPrice = product.price * (1 - product.discount_percent / 100);

  if (!product.in_stock) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-3 flex gap-3 animate-fade-in">
      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-sm truncate">{product.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-display font-bold text-base">Rs {Math.round(discountedPrice)}</span>
          {product.discount_percent > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">Rs {product.price}</span>
              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {product.discount_percent}% OFF
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-end shrink-0">
        {cartItem ? (
          <div className="flex items-center gap-1 bg-primary rounded-lg">
            <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="p-2 text-primary-foreground">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-primary-foreground font-bold text-sm min-w-[1.25rem] text-center">{cartItem.quantity}</span>
            <button onClick={() => addItem(product, shopId)} className="p-2 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(product, shopId)}
            className="bg-primary text-primary-foreground rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
