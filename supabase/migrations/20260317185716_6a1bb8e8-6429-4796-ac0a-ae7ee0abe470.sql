
-- Fix overly permissive WITH CHECK on order_items insert
DROP POLICY IF EXISTS "Authenticated insert order items" ON public.order_items;
CREATE POLICY "Authenticated insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.customer_id = auth.uid()
    )
  );

-- Fix overly permissive WITH CHECK on orders update
DROP POLICY IF EXISTS "Involved users update orders" ON public.orders;
CREATE POLICY "Involved users update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    (customer_id = auth.uid()) OR
    (rider_id = auth.uid()) OR
    ((status = 'confirmed') AND (rider_id IS NULL)) OR
    (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()))
  )
  WITH CHECK (
    (customer_id = auth.uid()) OR
    (rider_id = auth.uid()) OR
    ((status = 'confirmed') AND (rider_id IS NULL)) OR
    (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()))
  );
