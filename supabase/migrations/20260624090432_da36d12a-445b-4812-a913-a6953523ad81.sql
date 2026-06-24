
-- 1. activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON public.activity_logs (user_id);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read activity"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert activity"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. messages (internal chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages (recipient_id, read);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Send messages as self"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipient marks read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Update handle_new_user: no random pravatar, carry metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  v_is_pro boolean := COALESCE((NEW.raw_user_meta_data->>'is_professional')::boolean, false);
  v_name   text    := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, profession, category, is_professional, avatar_url)
  VALUES (
    NEW.id, v_name, NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'profession',
    NEW.raw_user_meta_data->>'category',
    v_is_pro,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN v_is_pro THEN 'professional'::public.app_role ELSE 'client'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.activity_logs (user_id, actor_name, action, entity_type, entity_id)
  VALUES (NEW.id, v_name, 'user.signup', 'user', NEW.id);

  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Booking notification + log trigger
CREATE OR REPLACE FUNCTION public.handle_booking_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  v_pro_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- notify the professional
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.professional_id,
      'booking_pending',
      'New booking request',
      NEW.client_name || ' requested ' || NEW.event_name || ' on ' || NEW.event_date || ' at ' || to_char(NEW.start_time, 'HH24:MI'),
      '/dashboard/bookings'
    );
    INSERT INTO public.activity_logs (user_id, actor_name, action, entity_type, entity_id, metadata)
    VALUES (NEW.client_id, NEW.client_name, 'booking.created', 'booking', NEW.id,
      jsonb_build_object('event_name', NEW.event_name, 'date', NEW.event_date, 'professional_id', NEW.professional_id));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT full_name INTO v_pro_name FROM public.profiles WHERE id = NEW.professional_id;
    IF NEW.client_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        NEW.client_id,
        'booking_' || NEW.status::text,
        'Booking ' || NEW.status::text,
        COALESCE(v_pro_name,'Professional') || ' marked your booking "' || NEW.event_name || '" as ' || NEW.status::text,
        '/dashboard/bookings'
      );
    END IF;
    INSERT INTO public.activity_logs (user_id, actor_name, action, entity_type, entity_id, metadata)
    VALUES (NEW.professional_id, v_pro_name, 'booking.' || NEW.status::text, 'booking', NEW.id,
      jsonb_build_object('event_name', NEW.event_name, 'date', NEW.event_date, 'time', to_char(NEW.start_time,'HH24:MI')));
    RETURN NEW;
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS bookings_event_trg ON public.bookings;
CREATE TRIGGER bookings_event_trg
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_event();

-- 5. Profile update log
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.activity_logs (user_id, actor_name, action, entity_type, entity_id)
  VALUES (NEW.id, NEW.full_name, 'profile.updated', 'profile', NEW.id);
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS profiles_update_log ON public.profiles;
CREATE TRIGGER profiles_update_log
  AFTER UPDATE ON public.profiles
  FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.handle_profile_update();

-- 6. Clear existing pravatar URLs so initials show
UPDATE public.profiles SET avatar_url = NULL
WHERE avatar_url LIKE 'https://i.pravatar.cc/%';

-- 7. Create admin user
DO $admin$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin@bookd.site';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@bookd.site',
      crypt('0206White!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Platform Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin@bookd.site', 'email_verified', true),
      'email', v_uid::text, now(), now(), now());
  END IF;

  -- Ensure admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $admin$;
