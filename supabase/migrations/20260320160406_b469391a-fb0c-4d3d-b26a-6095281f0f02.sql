
-- Villages table for village management
CREATE TABLE public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  source text NOT NULL DEFAULT 'system',
  submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved villages" ON public.villages
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert villages" ON public.villages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admin update villages" ON public.villages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete villages" ON public.villages
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  target_role text DEFAULT NULL,
  target_village text DEFAULT NULL,
  expires_at timestamp with time zone DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active announcements" ON public.announcements
  FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notification broadcasts log
CREATE TABLE public.broadcast_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_group text NOT NULL,
  target_village text DEFAULT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  reach_count integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage broadcasts" ON public.broadcast_logs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin settings table  
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings" ON public.admin_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage settings" ON public.admin_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('platform_name', 'DukkanDoor'),
  ('min_delivery_fee', '50'),
  ('max_delivery_fee', '500'),
  ('max_farm_radius_km', '25'),
  ('cancel_window_minutes', '2'),
  ('rider_exclusive_seconds', '60'),
  ('report_escalation_hours', '24');

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
