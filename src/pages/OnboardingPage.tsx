import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OnboardingForm from '../components/onboarding/OnboardingForm';
import { useAuth } from '../providers/AuthProvider.jsx';
import type { OnboardingFormValues, WorkflowStatus } from '../types/workflow';

const initialStatus: WorkflowStatus = { state: 'idle' };

function OnboardingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [status, setStatus] = useState<WorkflowStatus>(initialStatus);

  const defaultValues = useMemo<Partial<OnboardingFormValues>>(
    () => ({ fullName: session?.user?.user_metadata?.full_name ?? '' }),
    [session]
  );

  const handleSubmit = useCallback(
    async (values: OnboardingFormValues) => {
      if (!session) {
        setStatus({ state: 'error', message: 'Your session expired. Please log in again.' });
        navigate('/auth', { replace: true });
        return;
      }

      setStatus({ state: 'submitting', message: 'Generating your intelligence report…' });

      try {
        if (!session.access_token) {
          throw new Error('Unable to obtain session token. Please sign in again.');
        }

        const response = await fetch('/functions/v1/run-intelligence-workflow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
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

        setStatus({
          state: 'success',
          message: 'We started building your intelligence report. You will receive an email when it is ready.'
        });

        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (error) {
        setStatus({
          state: 'error',
          message: error instanceof Error ? error.message : 'Unexpected error triggering workflow.'
        });
      }
    },
    [navigate, session]
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

