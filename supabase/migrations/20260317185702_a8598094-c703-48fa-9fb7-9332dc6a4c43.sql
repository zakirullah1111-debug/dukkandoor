
-- ============================================
-- UPGRADE 1: Rider profile columns
-- ============================================
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS profile_photo_url text NOT NULL DEFAULT '';
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze';
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS total_deliveries integer NOT NULL DEFAULT 0;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS average_rating numeric NOT NULL DEFAULT 0;

-- ratings: add review_text (comment already exists but request asks for review_text)
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS review_text text NOT NULL DEFAULT '';

-- ============================================
-- UPGRADE 3: Delivery photo
-- ============================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_photo_url text NOT NULL DEFAULT '';

-- ============================================
-- UPGRADE 2: Rider selection
-- ============================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_selected_by_customer boolean NOT NULL DEFAULT false;

-- ============================================
-- UPGRADE 5: Shop business hours
-- ============================================
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS business_hours jsonb;

-- ============================================
-- UPGRADE 6: Low stock
-- ============================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer;

-- ============================================
-- UPGRADE 7: Customer note
-- ============================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_note text NOT NULL DEFAULT '';

-- ============================================
-- UPGRADE 9: Favorites table
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  shop_id uuid,
  product_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers insert own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = customer_id);

-- ============================================
-- UPGRADE 12: Reports table
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by uuid NOT NULL,
  reported_user_id uuid,
  reason text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  order_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users read own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Admin read all reports" ON public.reports
  FOR SELECT USING (true);

-- ============================================
-- UPGRADE 12: Verified badge for riders
-- ============================================
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- ============================================
-- Storage buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('rider-photos', 'rider-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proofs', 'delivery-proofs', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for rider-photos
CREATE POLICY "Public read rider photos" ON storage.objects FOR SELECT USING (bucket_id = 'rider-photos');
CREATE POLICY "Authenticated upload rider photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rider-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated update rider photos" ON storage.objects FOR UPDATE USING (bucket_id = 'rider-photos' AND auth.role() = 'authenticated');

-- Storage policies for delivery-proofs
CREATE POLICY "Public read delivery proofs" ON storage.objects FOR SELECT USING (bucket_id = 'delivery-proofs');
CREATE POLICY "Authenticated upload delivery proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'delivery-proofs' AND auth.role() = 'authenticated');

-- ============================================
-- Rider tier auto-update function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_rider_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_deliveries >= 150 THEN
    NEW.tier := 'gold';
  ELSIF NEW.total_deliveries >= 50 THEN
    NEW.tier := 'silver';
  ELSE
    NEW.tier := 'bronze';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_rider_tier
  BEFORE UPDATE OF total_deliveries ON public.riders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rider_tier();

-- ============================================
-- Auto-update rider average_rating on new rating
-- ============================================
CREATE OR REPLACE FUNCTION public.update_rider_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.riders SET average_rating = (
    SELECT COALESCE(AVG(rating), 0) FROM public.ratings WHERE rider_id = NEW.rider_id
  ) WHERE user_id = NEW.rider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_rider_avg_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rider_average_rating();

-- ============================================
-- Decrement stock_quantity on order item insert
-- ============================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0),
      in_stock = CASE WHEN GREATEST(stock_quantity - NEW.quantity, 0) = 0 THEN false ELSE in_stock END
  WHERE id = NEW.product_id AND stock_quantity IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_order();

-- Enable realtime for favorites
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
