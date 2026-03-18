
-- Create messages table for in-app chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  message_text text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users update read status" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add rider location columns
ALTER TABLE public.riders
  ADD COLUMN IF NOT EXISTS current_lat double precision,
  ADD COLUMN IF NOT EXISTS current_lng double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Add order geocoding columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shop_lat double precision,
  ADD COLUMN IF NOT EXISTS shop_lng double precision,
  ADD COLUMN IF NOT EXISTS delivery_lat double precision,
  ADD COLUMN IF NOT EXISTS delivery_lng double precision;

-- Add preferred language to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';
