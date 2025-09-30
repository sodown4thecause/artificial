-- Reset daily limit for testing
DELETE FROM public.daily_report_limits WHERE report_date = CURRENT_DATE;