import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import TrialSignup from '../components/TrialSignup';

const TrialSignupPage: React.FC = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [trialStatus, setTrialStatus] = useState(null);

  const workflowId = location.state?.workflowId;
  const onboardingComplete = location.state?.onboardingComplete;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = 'https://accounts.artificialintelligentsia.co/sign-in';
      return;
    }

    if (isSignedIn) {
      checkUserTrialStatus();
    }
  }, [isSignedIn, isLoaded, navigate]);

  const checkUserTrialStatus = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-trial-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check trial status');
      }

      const data = await response.json();
      setTrialStatus(data);

      // If user already has active trial/subscription, redirect to dashboard
      if (data.trial_status === 'active' || data.subscription_status === 'active') {
        navigate('/dashboard', { replace: true });
        return;
      }

    } catch (error) {
      console.error('Trial status check failed:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleTrialStarted = () => {
    // After trial signup, redirect to dashboard
    navigate('/dashboard', { state: { trialJustStarted: true } });
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="trial-loading">
        <div className="spinner"></div>
        <h2>Setting up your trial...</h2>
        <p>Checking your account status</p>
      </div>
    );
  }

  return (
    <div className="trial-signup-page">
      {onboardingComplete && (
        <div className="onboarding-success-banner">
          <h2>🎉 Onboarding Complete!</h2>
          <p>Your intelligence report is being generated (Workflow ID: {workflowId})</p>
          <p>Start your 14-day free trial to access your report and all platform features:</p>
        </div>
      )}

      <div className="trial-content">
        <TrialSignup 
          onTrialStarted={handleTrialStarted}
          defaultCoupon={onboardingComplete ? "FREETRIAL14" : ""}
        />
      </div>

      {/* Add default coupon for new users */}
      {onboardingComplete && (
        <div className="special-offer">
          <div className="offer-content">
            <h3>🎟️ Special Onboarding Offer</h3>
            <p>Coupon code <strong>FREETRIAL14</strong> is automatically applied for new users!</p>
            <p>This gives you enhanced trial benefits and priority processing for your first report.</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .trial-signup-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        .trial-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f8fafc;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .onboarding-success-banner {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 3rem 0;
          text-align: center;
        }

        .onboarding-success-banner h2 {
          margin-bottom: 1rem;
          font-size: 2.5rem;
        }

        .onboarding-success-banner p {
          font-size: 1.1rem;
          margin: 0.5rem 0;
          opacity: 0.95;
        }

        .trial-content {
          padding: 2rem 0;
        }

        .special-offer {
          background: #f0fff4;
          border: 2px solid #48bb78;
          border-radius: 12px;
          margin: 2rem auto;
          max-width: 600px;
          padding: 0;
          overflow: hidden;
        }

        .offer-content {
          padding: 2rem;
          text-align: center;
        }

        .offer-content h3 {
          color: #38a169;
          margin-bottom: 1rem;
        }

        .offer-content p {
          margin: 0.5rem 0;
          color: #2d3748;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TrialSignupPage;
