import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, CheckCircle2, Circle, Package, Truck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrderContext';
import { mockRiders } from '@/data/mockData';

const steps = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useOrders();
  const orderId = (location.state as { orderId: string })?.orderId;
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center px-6">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button onClick={() => navigate('/home')}>Go Home</Button>
      </div>
    );
  }

  const statusIndex = steps.findIndex(s => s.key === order.status);
  const rider = mockRiders.find(r => r.id === order.rider_id);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Order Tracking</h1>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <div className="space-y-4">
          {steps.map((step, i) => {
            const done = i <= statusIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className={`absolute left-[1.45rem] mt-10 w-0.5 h-4 ${done ? 'bg-accent' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rider Info */}
      {rider && (
        <div className="bg-card rounded-xl border border-border p-4 mb-5">
          <p className="text-xs text-muted-foreground mb-2">Your Rider</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-semibold">{rider.user.name}</p>
              <p className="text-sm text-muted-foreground">{rider.vehicle_type}</p>
            </div>
            <a href={`tel:${rider.user.phone}`} className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-2">Order Summary</p>
        {order.items?.map(item => (
          <div key={item.id} className="flex justify-between py-1.5">
            <span className="text-sm">{item.product?.name} × {item.quantity}</span>
            <span className="text-sm font-semibold">Rs {Math.round(item.price_at_order * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between">
          <span className="font-display font-bold">Total</span>
          <span className="font-display font-bold">Rs {Math.round(order.total_amount)}</span>
        </div>
      </div>

      <Button onClick={() => navigate('/home')} variant="outline" className="w-full h-12 rounded-xl mt-6 font-display">
        Back to Home
      </Button>
    </div>
  );
};

export default OrderTracking;
