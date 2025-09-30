-- Fix signup_fingerprints table to work with Clerk TEXT user IDs

-- Drop RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view their signup fingerprint" ON public.signup_fingerprints;

-- Drop the foreign key constraint to auth.users
ALTER TABLE public.signup_fingerprints 
  DROP CONSTRAINT IF EXISTS signup_fingerprints_user_id_fkey;

-- Change user_id from UUID to TEXT to match Clerk user IDs
ALTER TABLE public.signup_fingerprints 
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate the unique constraint on user_id (it was lost during type change)
ALTER TABLE public.signup_fingerprints
  DROP CONSTRAINT IF EXISTS signup_fingerprints_user_id_key;

ALTER TABLE public.signup_fingerprints
  ADD CONSTRAINT signup_fingerprints_user_id_key UNIQUE (user_id);

-- Note: RLS policies are managed by Edge Functions with service role key
-- since Clerk authentication happens at the application level

COMMENT ON TABLE public.signup_fingerprints IS 'Tracks signup fingerprints for trial management. user_id is Clerk user ID (text format).';