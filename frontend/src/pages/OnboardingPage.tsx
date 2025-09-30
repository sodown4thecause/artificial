import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OnboardingForm from '../components/onboarding/OnboardingForm';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { OnboardingFormValues, WorkflowStatus } from '../types/workflow';

const initialStatus: WorkflowStatus = { state: 'idle' };

function OnboardingPage() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [status, setStatus] = useState<WorkflowStatus>(initialStatus);

  const defaultValues = useMemo<Partial<OnboardingFormValues>>(
    () => ({ 
      fullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || ''
    }),
    [user]
  );

  const handleSubmit = useCallback(
    async (values: OnboardingFormValues) => {
      if (!isSignedIn) {
        setStatus({ state: 'error', message: 'Your session expired. Please log in again.' });
        window.location.href = 'https://accounts.artificialintelligentsia.co/sign-in';
        return;
      }

      setStatus({ state: 'submitting', message: 'Generating your intelligence report…' });

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Unable to obtain session token. Please sign in again.');
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-intelligence-workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: values.fullName,
            websiteUrl: values.websiteUrl,
            industry: values.industry,
            location: values.location
          })
        });

        if (!response.ok) {
          const errorDetail = await response.json().catch(() => null);
          if (errorDetail?.error === 'IP_LIMIT_EXCEEDED') {
            throw new Error(
              'We detected an account from this network already. Only one free launch account is allowed per IP during the trial.'
            );
          }

          throw new Error(errorDetail?.message || 'Workflow failed to start');
        }

        const result = await response.json();
        
        setStatus({
          state: 'success',
          message: 'We started building your intelligence report. You will receive an email when it is ready.'
        });

        // After successful onboarding, redirect to trial signup
        setTimeout(() => {
          navigate('/trial-signup', { 
            state: { 
              workflowId: result.workflowId, 
              onboardingComplete: true 
            }
          });
        }, 2000);
      } catch (error) {
        setStatus({
          state: 'error',
          message: error instanceof Error ? error.message : 'Unexpected error triggering workflow.'
        });
      }
    },
    [navigate, isSignedIn, getToken]
  );

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <header>
          <h1>Complete your growth intelligence profile</h1>
          <p>
            Provide a few details so our AI agents can analyze your market footprint, uncover new
            opportunities, and deliver a bespoke growth strategy.
          </p>
        </header>

        <OnboardingForm defaultValues={defaultValues} isSubmitting={status.state === 'submitting'} onSubmit={handleSubmit} />

        {status.state !== 'idle' && (
          <div className={`status-banner ${status.state}`}>
            <p>{status.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;

