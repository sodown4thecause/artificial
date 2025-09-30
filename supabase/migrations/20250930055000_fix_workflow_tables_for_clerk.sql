-- Fix all workflow tables to work with Clerk TEXT user IDs

-- Fix onboarding_profiles table
ALTER TABLE public.onboarding_profiles 
  DROP CONSTRAINT IF EXISTS onboarding_profiles_user_id_fkey;

ALTER TABLE public.onboarding_profiles 
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- Add unique constraint on user_id for upsert operations
ALTER TABLE public.onboarding_profiles
  DROP CONSTRAINT IF EXISTS onboarding_profiles_user_id_key;

ALTER TABLE public.onboarding_profiles
  ADD CONSTRAINT onboarding_profiles_user_id_key UNIQUE (user_id);

-- Fix workflow_runs table
ALTER TABLE public.workflow_runs 
  DROP CONSTRAINT IF EXISTS workflow_runs_user_id_fkey;

ALTER TABLE public.workflow_runs 
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate index
DROP INDEX IF EXISTS idx_workflow_runs_user_id;
CREATE INDEX idx_workflow_runs_user_id ON public.workflow_runs(user_id);

-- Add comments
COMMENT ON TABLE public.onboarding_profiles IS 'User onboarding profiles. user_id is Clerk user ID (text format).';
COMMENT ON TABLE public.workflow_runs IS 'Workflow execution tracking. user_id is Clerk user ID (text format).';