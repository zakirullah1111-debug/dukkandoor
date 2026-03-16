
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer',
  village text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Shops table
CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  is_open boolean NOT NULL DEFAULT true,
  logo_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  rating numeric NOT NULL DEFAULT 0,
  delivery_time text NOT NULL DEFAULT '20-30 min'
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shops" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Owner insert shop" ON public.shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner update shop" ON public.shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner delete shop" ON public.shops FOR DELETE USING (auth.uid() = owner_id);

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Shop owner insert products" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Shop owner update products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Shop owner delete products" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));

-- Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  shop_id uuid NOT NULL REFERENCES public.shops(id),
  rider_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'placed',
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 50,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  delivery_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Customer insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Involved users update orders" ON public.orders FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid() OR
    rider_id = auth.uid() OR
    (status = 'confirmed' AND rider_id IS NULL) OR
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  ) WITH CHECK (true);

-- Order items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  price_at_order numeric NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- Riders table
CREATE TABLE public.riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT false,
  total_earnings numeric NOT NULL DEFAULT 0,
  vehicle_type text NOT NULL DEFAULT 'Motorcycle'
);
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read riders" ON public.riders FOR SELECT USING (true);
CREATE POLICY "Rider insert own" ON public.riders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Rider update own" ON public.riders FOR UPDATE USING (auth.uid() = user_id);

-- Ratings table
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  rated_by uuid NOT NULL REFERENCES public.profiles(id),
  rider_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Customer insert rating" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rated_by);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage RLS
CREATE POLICY "Public read shop images" ON storage.objects FOR SELECT USING (bucket_id = 'shop-images');
CREATE POLICY "Auth upload shop images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-images');
CREATE POLICY "Auth update shop images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "Auth delete shop images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Auth upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Auth update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Auth delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
