import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, ToggleLeft, ToggleRight, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { mockShops, mockProducts } from '@/data/mockData';

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const [isOpen, setIsOpen] = useState(true);

  // Find the shopkeeper's shop (mock: first shop)
  const shop = mockShops[0];
  const shopOrders = orders.filter(o => o.shop_id === shop.id);
  const pendingOrders = shopOrders.filter(o => o.status === 'placed');
  const todayEarnings = shopOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0);
  const products = mockProducts.filter(p => p.shop_id === shop.id);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">{shop.shop_name}</h1>
          <p className="text-sm text-muted-foreground">Shopkeeper Dashboard</p>
        </div>
        <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="text-sm text-muted-foreground">Logout</button>
      </div>

      {/* Open/Close Toggle */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between mb-5 min-h-[56px]">
        <span className="font-display font-semibold">Shop Status</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isOpen ? 'text-accent' : 'text-destructive'}`}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
          {isOpen ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-light rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="font-display font-bold text-lg">Rs {todayEarnings}</p>
          <p className="text-[10px] text-muted-foreground">Today's Earnings</p>
        </div>
        <div className="bg-orange-light rounded-xl p-3 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">{pendingOrders.length}</p>
          <p className="text-[10px] text-muted-foreground">Pending Orders</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <ShoppingBag className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="font-display font-bold text-lg">{products.length}</p>
          <p className="text-[10px] text-muted-foreground">Products</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button onClick={() => navigate('/shopkeeper/orders')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">Incoming Orders</span>
          {pendingOrders.length > 0 && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrders.length}</span>}
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate('/shopkeeper/products')} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between min-h-[52px] active:scale-[0.98] transition-transform">
          <span className="font-semibold text-sm">My Products</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate('/shopkeeper/add-product')} className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 min-h-[52px] font-display font-semibold active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;
