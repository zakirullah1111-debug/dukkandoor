
-- Create farmer_profiles table
CREATE TABLE public.farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  farm_lat double precision,
  farm_lng double precision,
  farm_landmark text,
  saved_contacts jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read farmer profiles" ON public.farmer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farmer insert own profile" ON public.farmer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmer update own profile" ON public.farmer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Farmer delete own profile" ON public.farmer_profiles FOR DELETE USING (auth.uid() = user_id);

-- Create hotel_profiles table
CREATE TABLE public.hotel_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hotel_name text NOT NULL DEFAULT '',
  hotel_type text NOT NULL DEFAULT 'Hotel',
  description text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  is_open boolean NOT NULL DEFAULT false,
  prep_time_minutes integer NOT NULL DEFAULT 15,
  rating numeric NOT NULL DEFAULT 0,
  business_hours jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read hotel profiles" ON public.hotel_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read hotel profiles" ON public.hotel_profiles FOR SELECT USING (true);
CREATE POLICY "Hotel owner insert own profile" ON public.hotel_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Hotel owner update own profile" ON public.hotel_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Hotel owner delete own profile" ON public.hotel_profiles FOR DELETE USING (auth.uid() = user_id);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotel_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Lunch',
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Hotel owner insert menu items" ON public.menu_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hotel_profiles WHERE id = menu_items.hotel_id AND user_id = auth.uid())
);
CREATE POLICY "Hotel owner update menu items" ON public.menu_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hotel_profiles WHERE id = menu_items.hotel_id AND user_id = auth.uid())
);
CREATE POLICY "Hotel owner delete menu items" ON public.menu_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.hotel_profiles WHERE id = menu_items.hotel_id AND user_id = auth.uid())
);

-- Add new columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'shop_order';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS home_contact_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS farmer_offered_fee integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_acceptance_deadline timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS urgent boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hotel_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_description text;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-images', 'hotel-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for hotel-images
CREATE POLICY "Public read hotel images" ON storage.objects FOR SELECT USING (bucket_id = 'hotel-images');
CREATE POLICY "Auth upload hotel images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hotel-images');

-- Storage policies for menu-images
CREATE POLICY "Public read menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Auth upload menu images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images');
