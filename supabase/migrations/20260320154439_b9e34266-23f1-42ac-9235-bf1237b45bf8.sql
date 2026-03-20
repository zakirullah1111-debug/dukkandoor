
-- Make shop_id nullable for home_pickup and other farmer order types
ALTER TABLE public.orders ALTER COLUMN shop_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;

-- Re-add it but allowing NULL
ALTER TABLE public.orders ADD CONSTRAINT orders_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE SET NULL;
