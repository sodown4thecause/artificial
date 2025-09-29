import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';

function ClerkAuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if Clerk is properly configured
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/90 border-slate-800">
          <CardHeader className="text-center">
            <h2 className="text-2xl font-bold text-white">🔧 Authentication Setup Required</h2>
            <p className="text-slate-300">Clerk authentication is not configured. Please follow these steps:</p>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 mb-6">
              <li>Copy <code className="bg-slate-800 px-1 py-0.5 rounded text-sm">frontend/.env.example</code> to <code className="bg-slate-800 px-1 py-0.5 rounded text-sm">frontend/.env</code></li>
              <li>Get your Clerk publishable key from <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Clerk Dashboard</a></li>
              <li>Add your key to <code className="bg-slate-800 px-1 py-0.5 rounded text-sm">VITE_CLERK_PUBLISHABLE_KEY</code> in the .env file</li>
              <li>Restart the development server</li>
            </ol>
            <div className="text-center">
              <a href="/" className="text-blue-400 hover:text-blue-300 underline">← Back to home</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { isSignedIn, isLoaded, getToken } = useAuth();

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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/90 border-slate-800">
          <CardContent className="text-center py-8">
            <div className="text-slate-300">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [isSignUp, setIsSignUp] = useState(searchParams.get('tab') === 'signup');
  
  // Update URL when tab changes
  const handleTabChange = (isSignUpTab) => {
    setIsSignUp(isSignUpTab);
    const newParams = new URLSearchParams(searchParams);
    if (isSignUpTab) {
      newParams.set('tab', 'signup');
    } else {
      newParams.set('tab', 'signin');
    }
    navigate({ search: newParams.toString() }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🔐 Secure Authentication</h2>
          <p className="text-slate-300">
            You're being redirected to our secure authentication portal at
          </p>
          <p className="text-blue-400 font-mono text-sm mt-1">
            accounts.artificialintelligentsia.co
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleTabChange(false)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  !isSignUp 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleTabChange(true)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isSignUp 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Sign Up
              </button>
            </div>
            
            {/* Show the appropriate Clerk component */}
            <div className="mt-6">
              {!isSignUp ? (
                <SignIn 
                  path="/clerk-auth"
                  routing="path"
                  signUpUrl="/clerk-auth?tab=signup"
                  afterSignInUrl="/onboarding"
                />
              ) : (
                <SignUp 
                  path="/clerk-auth"
                  routing="path"
                  signInUrl="/clerk-auth?tab=signin"
                  afterSignUpUrl="/onboarding"
                />
              )}
            </div>
            
            {/* Troubleshooting section */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">📧 Email Issues?</h3>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• Check your spam/junk folder</p>
                <p>• Try Gmail, Outlook, or Yahoo email addresses</p>
                <p>• Use social sign-in (Google, GitHub, etc.) as alternative</p>
                <p>• Emails usually arrive within 1-2 minutes</p>
              </div>
              
              <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-800">
                <p className="text-xs text-blue-300">
                  <strong>Note:</strong> Authentication is handled on our secure domain 
                  <code className="bg-blue-800/50 px-1 rounded">accounts.artificialintelligentsia.co</code> 
                  for better email delivery and security.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClerkAuthPage;
