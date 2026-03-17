import { useState, useEffect, useRef } from 'react';
import { Loader2, Star, Bike, Shield, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  onComplete: () => void;
}

const tierEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };

const RiderSelectionModal = ({ orderId, onComplete }: Props) => {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchRiders = async () => {
      const { data } = await (supabase as any).from('riders')
        .select('*, profiles!riders_user_id_fkey(name)')
        .eq('is_available', true);
      setRiders(data || []);
      setLoading(false);
    };
    fetchRiders();

    // Listen for order updates (rider accepted)
    const channel = supabase.channel(`rider-select-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => {
          if (payload.new.rider_id) {
            toast.success('Rider accepted your order!');
            onComplete();
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); if (timerRef.current) clearInterval(timerRef.current); };
  }, [orderId]);

  const selectRider = async (riderUserId: string) => {
    setSelectedRider(riderUserId);
    // Set rider_selected_by_customer and rider_id temporarily
    await (supabase as any).from('orders').update({
      rider_id: riderUserId,
      rider_selected_by_customer: true,
    }).eq('id', orderId);

    // Start 60-second countdown
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Broadcast to all riders
          broadcastToAll();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const broadcastToAll = async () => {
    setBroadcasting(true);
    // Remove specific rider assignment, broadcast to all
    await (supabase as any).from('orders').update({
      rider_id: null,
      rider_selected_by_customer: false,
    }).eq('id', orderId);
    toast.info('Broadcasting to all available riders...');
    // Now just wait for any rider to accept via realtime
  };

  const chooseFastest = async () => {
    setBroadcasting(true);
    toast.info('Broadcasting to all available riders...');
    // Order is already confirmed with no rider_id — riders can see it
    onComplete();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (countdown !== null) {
    return (
      <div className="text-center py-6">
        <Timer className="w-8 h-8 mx-auto text-primary mb-3" />
        <p className="font-display font-semibold text-lg mb-1">Waiting for rider to accept...</p>
        <p className="text-3xl font-display font-bold text-primary mb-2">0:{String(countdown).padStart(2, '0')}</p>
        <p className="text-sm text-muted-foreground">If not accepted, we'll broadcast to all riders</p>
      </div>
    );
  }

  if (broadcasting) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="font-display font-semibold">Broadcasting to all available riders...</p>
        <p className="text-sm text-muted-foreground mt-1">First rider to accept gets the job</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-center mb-1">Choose Your Rider</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">Select a preferred rider or let us find the fastest one</p>

      <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
        {riders.map(r => (
          <button
            key={r.id}
            onClick={() => selectRider(r.user_id)}
            className="w-full bg-card rounded-xl border border-border p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {r.profile_photo_url ? (
                <img src={r.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Bike className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{r.profiles?.name || 'Rider'}</span>
                {r.is_verified && <Shield className="w-3.5 h-3.5 text-primary fill-primary/20" />}
                <span className="text-xs">{tierEmoji[r.tier] || '🥉'}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span className="text-xs font-medium">{Number(r.average_rating).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">• {r.total_deliveries} deliveries</span>
              </div>
            </div>
            <span className="text-primary font-semibold text-sm shrink-0">Choose</span>
          </button>
        ))}
        {riders.length === 0 && <p className="text-center text-muted-foreground py-4">No riders available right now</p>}
      </div>

      <Button onClick={chooseFastest} variant="outline" className="w-full h-12 rounded-xl font-display">
        Any Rider (Fastest) ⚡
      </Button>
    </div>
  );
};

export default RiderSelectionModal;
