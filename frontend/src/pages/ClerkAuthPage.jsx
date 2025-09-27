import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth as useClerkAuth } from '@clerk/clerk-react';
import './auth-setup.css';

function ClerkAuthPage() {
  const navigate = useNavigate();
  
  // Check if Clerk is properly configured
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!clerkPubKey) {
    return (
      <div className="auth-page">
        <div className="auth-setup-required">
          <h2>🔧 Authentication Setup Required</h2>
          <p>Clerk authentication is not configured. Please follow these steps:</p>
          <ol>
            <li>Copy <code>frontend/.env.example</code> to <code>frontend/.env</code></li>
            <li>Get your Clerk publishable key from <a href="https://dashboard.clerk.com" target="_blank">Clerk Dashboard</a></li>
            <li>Add your key to <code>VITE_CLERK_PUBLISHABLE_KEY</code> in the .env file</li>
            <li>Restart the development server</li>
          </ol>
          <div className="setup-note">
            <p><strong>Note:</strong> This message appears because you're in development mode without proper Clerk configuration.</p>
            <p><a href="/">← Back to home</a> | <a href="/auth">Try fallback auth</a></p>
          </div>
        </div>
      </div>
    );
  }
  
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if user has completed onboarding
      checkOnboardingStatus();
    }
  }, [isSignedIn, isLoaded, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-trial-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.has_completed_onboarding) {
          // User has onboarded, check trial status
          if (data.trial_status === 'eligible') {
            navigate('/trial-signup', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // User needs to complete onboarding
          navigate('/onboarding', { replace: true });
        }
      } else {
        // Fallback to onboarding if status check fails
        navigate('/onboarding', { replace: true });
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      navigate('/onboarding', { replace: true });
    }
  };

  if (!isLoaded) {
    return (
      <div className="auth-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <header>
        <h1>Secure Sign-In</h1>
        <p>
          Create your account or log in to access AI-powered business intelligence dashboards.
        </p>
      </header>

      <div className="auth-container">
        <div className="auth-tabs">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: {
                  backgroundColor: '#4ca5ff',
                  '&:hover': {
                    backgroundColor: '#2361ff'
                  }
                }
              }
            }}
            redirectUrl="/onboarding"
          />
        </div>
      </div>

      <div className="auth-footer">
        <span>Need help? Contact support.</span>
        <a href="/">Back to site</a>
      </div>
    </div>
  );
}

export default ClerkAuthPage;
