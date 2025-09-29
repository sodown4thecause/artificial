import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';

function ClerkAuthPage() {
  const navigate = useNavigate();
  
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/90 border-slate-800">
          <CardContent className="text-center py-8">
            <div className="text-slate-300">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-900/90 border-slate-800">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-white">Secure Sign-In</h1>
          <p className="text-slate-300">
            Create your account or log in to access AI-powered business intelligence dashboards.
          </p>
        </CardHeader>
        <CardContent>
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: {
                  backgroundColor: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#2563eb'
                  }
                },
                card: {
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                },
                headerTitle: {
                  color: '#f1f5f9'
                },
                headerSubtitle: {
                  color: '#94a3b8'
                },
                formFieldLabel: {
                  color: '#94a3b8'
                },
                formFieldInput: {
                  backgroundColor: '#1e293b',
                  borderColor: '#475569',
                  color: '#f1f5f9'
                },
                dividerText: {
                  color: '#64748b'
                },
                socialButtonsBlockButton: {
                  backgroundColor: '#1e293b',
                  borderColor: '#475569',
                  color: '#f1f5f9'
                }
              }
            }}
            redirectUrl="/onboarding"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ClerkAuthPage;
