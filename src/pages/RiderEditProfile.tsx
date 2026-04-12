import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const tierThresholds = [
  { tier: 'bronze', min: 0, max: 49, next: 'silver', nextAt: 50 },
  { tier: 'silver', min: 50, max: 149, next: 'gold', nextAt: 150 },
  { tier: 'gold', min: 150, max: Infinity, next: null, nextAt: null },
];

const RiderEditProfile = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [rider, setRider] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const load = async () => {
      try {
        const [riderRes, reviewsRes] = await Promise.all([
          (supabase as any).from('riders').select('*').eq('user_id', session.user.id).maybeSingle(),
          (supabase as any).from('ratings')
            .select('*, profiles!ratings_rated_by_fkey(name)')
            .eq('rider_id', session.user.id)
            .order('created_at', { ascending: false }),
        ]);
        if (riderRes.data) {
          setRider(riderRes.data);
          setBio(riderRes.data.bio || '');
          setPhotoPreview(riderRes.data.profile_photo_url || '');
        }
        if (reviewsRes.data) setReviews(reviewsRes.data);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      let photoUrl = rider?.profile_photo_url || '';
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `${session.user.id}.${ext}`;
        await supabase.storage.from('rider-photos').upload(path, photoFile, { upsert: true });
        const { data } = supabase.storage.from('rider-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
      await (supabase as any).from('riders')
        .update({ bio, profile_photo_url: photoUrl })
        .eq('user_id', session.user.id);
      toast.success('Profile updated!');
      navigate(-1);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  // FIX: show friendly error if rider record missing instead of broken blank UI
  if (loadError || !rider) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <p className="font-display text-lg font-bold text-center">Profile not found</p>
      <p className="text-sm text-muted-foreground text-center">
        Your rider profile could not be loaded. Please try again.
      </p>
      <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl h-12 px-8">
        Go Back
      </Button>
    </div>
  );

  const tierData = tierThresholds.find(
    t => (rider?.total_deliveries || 0) >= t.min && (rider?.total_deliveries || 0) <= t.max
  ) || tierThresholds[0];
  const progressToNext = tierData.nextAt
    ? Math.min(((rider?.total_deliveries || 0) / tierData.nextAt) * 100, 100)
    : 100;
  const remaining = tierData.nextAt ? tierData.nextAt - (rider?.total_deliveries || 0) : 0;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Edit Profile</h1>
      </div>

      {/* Photo */}
      <div className="flex flex-col items-center mb-6">
        <label className="relative cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-primary/20">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
          }} />
        </label>
        <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-1.5 block">Bio</label>
        <Textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="e.g., Fast & reliable, 2 years experience"
          className="rounded-xl"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/200</p>
      </div>

      {/* Tier Progress */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="font-display font-semibold text-sm mb-2">Tier Progress</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">
            {tierData.tier === 'gold' ? '🥇' : tierData.tier === 'silver' ? '🥈' : '🥉'}
          </span>
          <span className="font-bold text-sm capitalize">{tierData.tier}</span>
          {tierData.next && (
            <span className="text-xs text-muted-foreground">→ {tierData.next}</span>
          )}
        </div>
        <Progress value={progressToNext} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">
          {tierData.next
            ? `${remaining} more deliveries to reach ${tierData.next.charAt(0).toUpperCase() + tierData.next.slice(1)} ${tierData.next === 'silver' ? '🥈' : '🥇'}`
            : "You've reached the highest tier! 🎉"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="font-display font-bold text-lg">{Number(rider?.average_rating || 0).toFixed(1)} ⭐</p>
          <p className="text-xs text-muted-foreground">Average Rating</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="font-display font-bold text-lg">{rider?.total_deliveries || 0}</p>
          <p className="text-xs text-muted-foreground">Total Deliveries</p>
        </div>
      </div>

      {/* Reviews */}
      <h3 className="font-display font-semibold text-sm mb-3">My Reviews ({reviews.length})</h3>
      <div className="space-y-2 mb-8">
        {reviews.slice(0, 10).map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1 mb-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-xs ${s <= r.rating ? 'text-warning' : 'text-muted'}`}>★</span>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {(r.comment || r.review_text) && (
              <p className="text-sm text-muted-foreground">{r.review_text || r.comment}</p>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-xl font-display font-semibold">
        {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</> : 'Save Profile'}
      </Button>
    </div>
  );
};

export default RiderEditProfile;
