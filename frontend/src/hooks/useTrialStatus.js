import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useTrialStatus = () => {
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkTrialStatus = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setTrialStatus({ status: 'not_authenticated' });
        setLoading(false);
        return;
      }

      const response = await fetch('/functions/v1/check-trial-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check trial status');
      }

      const data = await response.json();
      setTrialStatus(data);
      setError(null);
    } catch (err) {
      console.error('Trial status check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const startTrial = async (planType = 'pro', couponCode = null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/functions/v1/create-trial-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType,
          couponCode,
          trialDays: 14
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start trial');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Trial start failed:', err);
      setError(err.message);
      throw err;
    }
  };

  const canUseWorkflows = () => {
    if (!trialStatus) return false;
    
    return trialStatus.trial_status === 'active' || 
           trialStatus.subscription_status === 'active' ||
           trialStatus.trial_status === 'eligible';
  };

  const getWorkflowLimitation = () => {
    if (!trialStatus) return 'Loading...';
    
    if (trialStatus.trial_status === 'active') {
      return `Trial: ${trialStatus.days_remaining} days remaining`;
    }
    
    if (trialStatus.trial_status === 'expired' && trialStatus.needs_subscription) {
      return 'Trial expired - Subscription required';
    }
    
    if (trialStatus.subscription_status === 'active') {
      return `Active subscription: ${trialStatus.plan_type}`;
    }
    
    if (trialStatus.trial_status === 'eligible') {
      return 'Start 14-day free trial to continue';
    }
    
    return 'Access restricted';
  };

  return {
    trialStatus,
    loading,
    error,
    checkTrialStatus,
    startTrial,
    canUseWorkflows,
    getWorkflowLimitation,
    refetch: checkTrialStatus
  };
};
