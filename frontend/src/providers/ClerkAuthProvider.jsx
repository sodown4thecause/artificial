import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createContext, useContext, useMemo } from 'react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Create a context that matches our existing useAuth interface
const AuthContext = createContext({
  session: null,
  loading: true,
  accessToken: null,
  user: null
});

// Auth adapter that converts Clerk's auth to our expected format
function AuthAdapter({ children }) {
  const { isLoaded, isSignedIn, user, getToken } = useClerkAuth();
  
  const value = useMemo(async () => {
    const loading = !isLoaded;
    const session = isSignedIn ? { user } : null;
    
    let accessToken = null;
    if (isSignedIn && isLoaded) {
      try {
        // Get Clerk JWT token
        accessToken = await getToken();
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
      }
    }

    return {
      session,
      loading,
      accessToken,
      user: isSignedIn ? user : null
    };
  }, [isLoaded, isSignedIn, user, getToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Main provider that wraps the app
export function AuthProvider({ children }) {
  if (!clerkPubKey) {
    console.warn('Clerk not configured. Set VITE_CLERK_PUBLISHABLE_KEY environment variable.');
    
    // Fallback context for development
    const fallbackValue = {
      session: null,
      loading: false,
      accessToken: null,
      user: null
    };
    
    return <AuthContext.Provider value={fallbackValue}>{children}</AuthContext.Provider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthAdapter>{children}</AuthAdapter>
    </ClerkProvider>
  );
}

// Hook that matches our existing useAuth interface
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
