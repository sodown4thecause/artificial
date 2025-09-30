-- Drop old UUID-based rate limiting functions before creating TEXT versions
-- This resolves the function overloading conflict

-- Drop old check_and_increment_daily_limit function that uses UUID
DROP FUNCTION IF EXISTS public.check_and_increment_daily_limit(uuid, text, integer);

-- Drop old get_daily_usage_stats function that uses UUID
DROP FUNCTION IF EXISTS public.get_daily_usage_stats(uuid, text);

-- Recreate with TEXT user_id (this should now be the only version)
CREATE OR REPLACE FUNCTION public.check_and_increment_daily_limit(
  p_user_id text,
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
      'message', format('Rate limiting check failed: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_daily_usage_stats with TEXT user_id
CREATE OR REPLACE FUNCTION public.get_daily_usage_stats(
  p_user_id text DEFAULT NULL,
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

COMMENT ON FUNCTION public.check_and_increment_daily_limit IS 'Rate limiting for report generation. Uses TEXT user_id for Clerk compatibility.';