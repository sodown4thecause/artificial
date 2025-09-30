-- Recreate unique constraints for daily_report_limits table after changing user_id to TEXT

-- Drop old constraints if they exist (they shouldn't after the column type change)
ALTER TABLE public.daily_report_limits 
  DROP CONSTRAINT IF EXISTS daily_report_limits_user_id_report_date_key;

ALTER TABLE public.daily_report_limits 
  DROP CONSTRAINT IF EXISTS daily_report_limits_ip_address_report_date_key;

-- Recreate the unique constraint for user_id + report_date
ALTER TABLE public.daily_report_limits
  ADD CONSTRAINT daily_report_limits_user_id_report_date_key 
  UNIQUE (user_id, report_date);

-- Recreate the unique constraint for ip_address + report_date
-- Make it DEFERRABLE INITIALLY DEFERRED to allow temporary violations during transactions
ALTER TABLE public.daily_report_limits
  ADD CONSTRAINT daily_report_limits_ip_address_report_date_key 
  UNIQUE (ip_address, report_date) DEFERRABLE INITIALLY DEFERRED;

COMMENT ON TABLE public.daily_report_limits IS 'Rate limiting for report generation. user_id is Clerk user ID (text format). Constraints ensure one record per user per day.';