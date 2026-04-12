import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Bike, Shield, Loader2, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const tierInfo: Record<string, { emoji: string; label: string; color: string }> = {
  bronze: { emoji: '🥉', label: 'Bronze', color: 'bg-orange-light text-primary' },
  silver: { emoji: '🥈', label: 'Silver', color: 'bg-muted text-foreground' },
  gold: { emoji: '🥇', label: 'Gold', color: 'bg-warning/20 text-warning' },
};

const RiderProfile = () => {
  const { riderId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [rider, setRider] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!riderId) { setLoading(false); return; }
    const load = async () => {
      try {
        // FIX: was .single() which throws if not found — now .maybeSingle() returns null safely
        const [riderRes, profileRes, reviewsRes] = await Promise.all([
          (supabase as any).from('riders').select('*').eq('user_id', riderId).maybeSingle(),
          (supabase as any).from('profiles').select('*').eq('id', riderId).maybeSingle(),
          (supabase as any).from('ratings')
            .select('*, profiles!ratings_rated_by_fkey(name)')
            .eq('rider_id', riderId)
            .order('created_at', { ascending: false }),
        ]);
        if (riderRes.data) setRider(riderRes.data);
        if (profileRes.data) setProfile(profileRes.data);
        if (reviewsRes.data) setReviews(reviewsRes.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [riderId]);

  const submitReport = async () => {
    if (!reportReason || !session?.user) return;
    setReporting(true);
    try {
      await (supabase as any).from('reports').insert({
        reported_by: session.user.id,
        reported_user_id: riderId,
        reason: reportReason,
        description: reportDesc,
      });
      toast.success('Report submitted');
      setReportOpen(false);
      setReportReason('');
      setReportDesc('');
    } catch { toast.error('Failed to submit report'); }
    finally { setReporting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error || !rider || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-lg font-display font-bold">Rider not found</p>
      <p className="text-sm text-muted-foreground text-center">This rider profile doesn't exist or may have been removed.</p>
      <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">Go Back</Button>
    </div>
  );

  const tier = tierInfo[rider.tier] || tierInfo.bronze;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={() => setReportOpen(true)} className="p-2 text-muted-foreground">
          <Flag className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-3 border-4 border-primary/20">
          {rider.profile_photo_url ? (
            <img src={rider.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-3xl font-bold text-primary">{profile.name?.charAt(0) || '?'}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold">{profile.name}</h1>
          {rider.is_verified && <Shield className="w-5 h-5 text-primary fill-primary/20" />}
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 ${tier.color}`}>
          {tier.emoji} {tier.label} Rider
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <Star className="w-5 h-5 mx-auto text-warning fill-warning mb-1" />
          <p className="font-display font-bold text-lg">{Number(rider.average_rating || 0).toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">{reviews.length} reviews</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <Bike className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="font-display font-bold text-lg">{rider.total_deliveries || 0}</p>
          <p className="text-[10px] text-muted-foreground">Deliveries</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <span className="text-xl block mb-0.5">{rider.vehicle_type === 'Motorcycle' ? '🏍️' : '🚲'}</span>
          <p className="font-display font-bold text-sm">{rider.vehicle_type || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground">Vehicle</p>
        </div>
      </div>

      {rider.bio && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-sm text-muted-foreground">{rider.bio}</p>
        </div>
      )}

      <div>
        <h2 className="font-display font-semibold text-base mb-3">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {(r.comment || r.review_text) && (
                  <p className="text-sm text-muted-foreground mt-1">{r.review_text || r.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">— {r.profiles?.name || 'Customer'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Sheet */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
          <SheetHeader><SheetTitle className="font-display">Report Rider</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rude behavior">Rude behavior</SelectItem>
                <SelectItem value="Wrong items">Wrong items</SelectItem>
                <SelectItem value="Late delivery">Late delivery</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Additional details (optional)" className="rounded-xl" />
            <Button onClick={submitReport} disabled={!reportReason || reporting} className="w-full h-12 rounded-xl font-display">
              {reporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RiderProfile;
