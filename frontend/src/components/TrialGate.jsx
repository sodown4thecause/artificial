import React from 'react';
import { useTrialStatus } from '../hooks/useTrialStatus';
import TrialSignup from './TrialSignup';

const TrialGate = ({ children, requireTrial = true }) => {
  const { trialStatus, loading, canUseWorkflows, getWorkflowLimitation } = useTrialStatus();

  if (loading) {
    return (
      <div className="trial-gate-loading">
        <div className="spinner"></div>
        <p>Checking your trial status...</p>
      </div>
    );
  }

  if (!requireTrial || canUseWorkflows()) {
    return (
      <>
        {/* Show trial status banner */}
        {trialStatus && (
          <div className={`trial-banner ${trialStatus.trial_status}`}>
            <div className="trial-info">
              <span className="status-text">{getWorkflowLimitation()}</span>
              {trialStatus.trial_status === 'active' && trialStatus.days_remaining <= 3 && (
                <a href="/billing" className="extend-link">Extend Subscription</a>
              )}
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // Show trial signup if access is required
  if (trialStatus?.trial_status === 'eligible') {
    return (
      <div className="trial-gate">
        <TrialSignup onTrialStarted={() => window.location.reload()} />
      </div>
    );
  }

  // Show subscription required message
  if (trialStatus?.trial_status === 'expired') {
    return (
      <div className="subscription-required">
        <h2>Trial Expired</h2>
        <p>Your 14-day free trial has ended. Continue with a subscription to access your intelligence reports.</p>
        
        <div className="subscription-options">
          <div className="plan">
            <h3>BI Dashboard Pro</h3>
            <p className="price">$49/month</p>
            <ul>
              <li>Unlimited intelligence reports</li>
              <li>Real-time SEO monitoring</li>
              <li>AI-powered insights</li>
            </ul>
            <button onClick={() => startTrial('pro')}>Subscribe to Pro</button>
          </div>
          
          <div className="plan featured">
            <h3>BI Dashboard Enterprise</h3>
            <p className="price">$199/month</p>
            <ul>
              <li>Everything in Pro</li>
              <li>Priority support</li>
              <li>Custom integrations</li>
            </ul>
            <button onClick={() => startTrial('enterprise')}>Subscribe to Enterprise</button>
          </div>
        </div>
      </div>
    );
  }

  // Default: show onboarding requirement
  return (
    <div className="onboarding-required">
      <h2>Complete Your Onboarding</h2>
      <p>Please complete the onboarding process to access your BI Dashboard.</p>
      <a href="/onboarding" className="onboarding-link">Start Onboarding</a>
    </div>
  );
};

export default TrialGate;
