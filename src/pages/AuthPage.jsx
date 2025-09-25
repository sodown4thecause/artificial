import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

import { useAuth } from '../providers/AuthProvider.jsx';
import { supabase } from '../supabaseClient';

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate('/onboarding', { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header>
          <h1>Secure Supabase Sign-In</h1>
          <p>
            Create your account or log in to access AI-powered dashboards. We use Supabase Auth to
            deliver a seamless, secure experience.
          </p>
        </header>

        {!supabase ? (
          <div className="status-banner error">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable
            authentication.
          </div>
        ) : (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4ca5ff',
                    brandAccent: '#2361ff',
                    inputBackground: '#0e1d33',
                    inputBorder: 'rgba(255, 255, 255, 0.16)',
                    inputText: '#f5f8ff',
                    inputPlaceholder: 'rgba(245, 248, 255, 0.6)'
                  }
                }
              },
              style: {
                input: {
                  backgroundColor: '#0e1d33',
                  color: '#f5f8ff',
                  borderColor: 'rgba(255, 255, 255, 0.16)'
                },
                label: {
                  color: 'rgba(245, 248, 255, 0.8)'
                }
              }
            }}
            providers={['google']}
            redirectTo={`${window.location.origin}/onboarding`}
            view="sign_in"
          />
        )}

        <div className="auth-footer">
          <span>Need help? Contact your account manager.</span>
          <a href="/">Back to site</a>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;

