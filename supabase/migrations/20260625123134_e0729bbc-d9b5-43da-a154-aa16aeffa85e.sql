
-- 1. add image_url to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

-- allow admin writes; readable by all (already public read presumably)
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. message → notification trigger so message arrivals act like bookings
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name text;
BEGIN
  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.recipient_id,
    'message',
    'New message from ' || COALESCE(v_sender_name, 'someone'),
    LEFT(NEW.body, 140),
    '/dashboard/messages'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS messages_notify ON public.messages;
CREATE TRIGGER messages_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- 3. seed common categories (idempotent via slug unique). Add Unsplash images.
INSERT INTO public.categories (name, slug, image_url) VALUES
  ('Photography','photography','https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'),
  ('Videography','videography','https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80'),
  ('Music & DJ','music-dj','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80'),
  ('Event Planning','event-planning','https://images.unsplash.com/photo-1530023367847-a683933f4172?w=800&q=80'),
  ('Catering','catering','https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80'),
  ('Coaching','coaching','https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80'),
  ('Legal','legal','https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80'),
  ('Consulting','consulting','https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80'),
  ('Fitness','fitness','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'),
  ('Wellness & Spa','wellness','https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'),
  ('Beauty & Makeup','beauty','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80'),
  ('Hair','hair','https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'),
  ('Tutoring','tutoring','https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'),
  ('Design','design','https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800&q=80'),
  ('Web & Tech','tech','https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'),
  ('Marketing','marketing','https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80'),
  ('Real Estate','real-estate','https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'),
  ('Home Services','home-services','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'),
  ('Cleaning','cleaning','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'),
  ('Auto & Mechanics','auto','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80'),
  ('Healthcare','healthcare','https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80'),
  ('Childcare','childcare','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80'),
  ('Pet Services','pet-services','https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80'),
  ('Speakers','speakers','https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80'),
  ('Writers & Translators','writers','https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80')
ON CONFLICT (slug) DO UPDATE SET image_url = COALESCE(public.categories.image_url, EXCLUDED.image_url);
