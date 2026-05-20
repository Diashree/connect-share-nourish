
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_proof_type text,
  ADD COLUMN IF NOT EXISTS id_proof_number text;

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '{}'::jsonb;
