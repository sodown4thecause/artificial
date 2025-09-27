-- Daily Report Generation Rate Limiting
-- This table tracks report generation to enforce daily limits during launch phase

CREATE TABLE IF NOT EXISTS public.daily_report_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  ip_address text,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  reports_generated integer NOT NULL DEFAULT 0,
  last_report_at timestamptz DEFAULT timezone('utc'::text, now()),
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now()),
  
  -- Ensure one record per user per day
  UNIQUE(user_id, report_date),
  -- Also track by IP for anonymous/pre-auth users
  UNIQUE(ip_address, report_date) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON public.daily_report_limits(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_limits_ip_date ON public.daily_report_limits(ip_address, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_limits_date ON public.daily_report_limits(report_date);

-- Function to check and increment daily usage
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_limit(
  p_user_id uuid,
  p_ip_address text,
  p_daily_limit integer DEFAULT 10
) RETURNS json AS $$
DECLARE
  v_current_count integer;
  v_record_exists boolean;
  v_result json;
BEGIN
  -- Get current count for today
  SELECT 
    reports_generated,
    true
  INTO 
    v_current_count,
    v_record_exists
  FROM public.daily_report_limits 
  WHERE (
    (p_user_id IS NOT NULL AND user_id = p_user_id) OR
    (p_user_id IS NULL AND ip_address = p_ip_address)
  )
  AND report_date = CURRENT_DATE;
  
  -- If no record exists, create one
  IF NOT v_record_exists THEN
    v_current_count := 0;
  END IF;
  
  -- Check if limit would be exceeded
  IF v_current_count >= p_daily_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'current_count', v_current_count,
      'daily_limit', p_daily_limit,
      'reset_time', (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
      'message', 'Daily report generation limit reached. Please try again tomorrow.'
    );
  END IF;
  
  -- Increment counter (upsert) - handle both user_id and ip_address cases
  IF p_user_id IS NOT NULL THEN
    -- For authenticated users, use user_id
    INSERT INTO public.daily_report_limits (
      user_id,
      ip_address,
      report_date,
      reports_generated,
      last_report_at
    ) VALUES (
      p_user_id,
      NULL, -- Don't store IP for authenticated users
      CURRENT_DATE,
      1,
      timezone('utc'::text, now())
    )
    ON CONFLICT (user_id, report_date) DO UPDATE SET
      reports_generated = daily_report_limits.reports_generated + 1,
      last_report_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now());
  ELSE
    -- For anonymous users, use IP address
    INSERT INTO public.daily_report_limits (
      user_id,
      ip_address,
      report_date,
      reports_generated,
      last_report_at
    ) VALUES (
      NULL,
      p_ip_address,
      CURRENT_DATE,
      1,
      timezone('utc'::text, now())
    )
    ON CONFLICT (ip_address, report_date) DO UPDATE SET
      reports_generated = daily_report_limits.reports_generated + 1,
      last_report_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE daily_report_limits.user_id IS NULL;
  END IF;
  
  -- Return success
  RETURN json_build_object(
    'allowed', true,
    'current_count', v_current_count + 1,
    'daily_limit', p_daily_limit,
    'remaining', p_daily_limit - (v_current_count + 1),
    'reset_time', (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
    'message', 'Report generation approved'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and deny request
    RAISE LOG 'Rate limiting error: %', SQLERRM;
    RETURN json_build_object(
      'allowed', false,
      'current_count', 0,
      'daily_limit', p_daily_limit,
      'message', 'Rate limiting check failed. Please try again.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage stats
CREATE OR REPLACE FUNCTION public.get_daily_usage_stats(
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'current_count', COALESCE(reports_generated, 0),
    'daily_limit', 10,
    'remaining', GREATEST(0, 10 - COALESCE(reports_generated, 0)),
    'reset_time', (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
    'last_report_at', last_report_at
  ) INTO v_result
  FROM public.daily_report_limits 
  WHERE (
    (p_user_id IS NOT NULL AND user_id = p_user_id) OR
    (p_user_id IS NULL AND ip_address = p_ip_address)
  )
  AND report_date = CURRENT_DATE;
  
  -- If no record exists, return default
  IF v_result IS NULL THEN
    v_result := json_build_object(
      'current_count', 0,
      'daily_limit', 10,
      'remaining', 10,
      'reset_time', (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
      'last_report_at', null
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to get overall usage statistics
CREATE OR REPLACE FUNCTION public.get_admin_usage_stats(
  p_date date DEFAULT CURRENT_DATE
) RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'total_users', COUNT(DISTINCT user_id),
    'total_reports', SUM(reports_generated),
    'unique_ips', COUNT(DISTINCT ip_address),
    'users_at_limit', COUNT(CASE WHEN reports_generated >= 10 THEN 1 END),
    'average_reports_per_user', ROUND(AVG(reports_generated), 2)
  ) INTO v_result
  FROM public.daily_report_limits
  WHERE report_date = p_date;
  
  RETURN COALESCE(v_result, json_build_object(
    'date', p_date,
    'total_users', 0,
    'total_reports', 0,
    'unique_ips', 0,
    'users_at_limit', 0,
    'average_reports_per_user', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.daily_report_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own records
CREATE POLICY "Users can view own daily limits" ON public.daily_report_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all records (for rate limiting functions)
CREATE POLICY "Service role can manage daily limits" ON public.daily_report_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Cleanup old records (optional - run periodically)
-- This keeps the table from growing indefinitely
CREATE OR REPLACE FUNCTION public.cleanup_old_daily_limits() RETURNS void AS $$
BEGIN
  DELETE FROM public.daily_report_limits 
  WHERE report_date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;