
-- ROLES
CREATE TYPE public.app_role AS ENUM ('donor', 'ngo', 'volunteer', 'admin');
CREATE TYPE public.donation_category AS ENUM ('food', 'clothes', 'books', 'medicines', 'essentials', 'electronics');
CREATE TYPE public.donation_status AS ENUM ('available', 'claimed', 'in_transit', 'completed', 'expired');
CREATE TYPE public.claim_status AS ENUM ('claimed', 'in_transit', 'completed', 'cancelled');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  org_name TEXT,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'ngo' THEN 2 WHEN 'donor' THEN 3 WHEN 'volunteer' THEN 4 END
  LIMIT 1
$$;

-- DONATIONS
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category donation_category NOT NULL,
  description TEXT,
  condition TEXT,
  quantity TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status donation_status NOT NULL DEFAULT 'available',
  expiry_date TIMESTAMPTZ,
  size TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- CLAIMS
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status claim_status NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- IMPACT LOGS
CREATE TABLE public.impact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  category donation_category NOT NULL,
  quantity TEXT,
  donor_id UUID NOT NULL,
  ngo_id UUID NOT NULL,
  volunteer_id UUID,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.impact_logs ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: donations
CREATE POLICY "Authenticated view donations" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors create donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id AND public.has_role(auth.uid(), 'donor'));
CREATE POLICY "Donor updates own donation" ON public.donations FOR UPDATE TO authenticated USING (auth.uid() = donor_id);
CREATE POLICY "NGO/Volunteer updates status on relevant claim" ON public.donations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.claims c WHERE c.donation_id = donations.id AND (c.ngo_id = auth.uid() OR c.volunteer_id = auth.uid()))
);
CREATE POLICY "Donor deletes own donation" ON public.donations FOR DELETE TO authenticated USING (auth.uid() = donor_id);
CREATE POLICY "Admins manage donations" ON public.donations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: claims
CREATE POLICY "View claims if involved" ON public.claims FOR SELECT TO authenticated USING (
  auth.uid() = ngo_id OR auth.uid() = volunteer_id
  OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid())
  OR (volunteer_id IS NULL AND public.has_role(auth.uid(), 'volunteer'))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "NGOs create claims" ON public.claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = ngo_id AND public.has_role(auth.uid(), 'ngo'));
CREATE POLICY "Involved users update claims" ON public.claims FOR UPDATE TO authenticated USING (
  auth.uid() = ngo_id OR auth.uid() = volunteer_id
  OR (volunteer_id IS NULL AND public.has_role(auth.uid(), 'volunteer'))
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: impact logs
CREATE POLICY "Involved view impact" ON public.impact_logs FOR SELECT TO authenticated USING (
  auth.uid() = donor_id OR auth.uid() = ngo_id OR auth.uid() = volunteer_id OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System inserts impact" ON public.impact_logs FOR INSERT TO authenticated WITH CHECK (true);

-- TRIGGER: auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER donations_touch BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
