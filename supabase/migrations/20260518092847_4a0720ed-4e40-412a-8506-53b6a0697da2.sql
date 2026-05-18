
-- Add 'pending' to claim_status enum if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'claim_status'::regtype) THEN
    ALTER TYPE claim_status ADD VALUE 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved' AND enumtypid = 'claim_status'::regtype) THEN
    ALTER TYPE claim_status ADD VALUE 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = 'claim_status'::regtype) THEN
    ALTER TYPE claim_status ADD VALUE 'rejected';
  END IF;
END $$;

-- Make donation_id and ngo_id nullable for community requests
ALTER TABLE public.claims ALTER COLUMN donation_id DROP NOT NULL;
ALTER TABLE public.claims ALTER COLUMN ngo_id DROP NOT NULL;

-- Add new columns to claims
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS requester_id uuid,
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS request_title text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS urgency text CHECK (urgency IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS location_text text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS concern_details text,
  ADD COLUMN IF NOT EXISTS responded_ngo_id uuid;

-- Add new columns to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS related_claim_id uuid,
  ADD COLUMN IF NOT EXISTS ngo_id uuid;

-- New RLS policies for community requests
DROP POLICY IF EXISTS "Anyone authenticated can create community request" ON public.claims;
CREATE POLICY "Anyone authenticated can create community request"
ON public.claims FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = requester_id AND donation_id IS NULL
);

DROP POLICY IF EXISTS "Requester views own requests" ON public.claims;
CREATE POLICY "Requester views own requests"
ON public.claims FOR SELECT TO authenticated
USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "NGOs view all pending community requests" ON public.claims;
CREATE POLICY "NGOs view all pending community requests"
ON public.claims FOR SELECT TO authenticated
USING (
  donation_id IS NULL AND has_role(auth.uid(), 'ngo'::app_role)
);

DROP POLICY IF EXISTS "NGOs respond to community requests" ON public.claims;
CREATE POLICY "NGOs respond to community requests"
ON public.claims FOR UPDATE TO authenticated
USING (
  donation_id IS NULL AND has_role(auth.uid(), 'ngo'::app_role)
);

-- Storage bucket for request photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-photos', 'request-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Request photos public read" ON storage.objects;
CREATE POLICY "Request photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-photos');

DROP POLICY IF EXISTS "Authenticated upload request photos" ON storage.objects;
CREATE POLICY "Authenticated upload request photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.claims REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
