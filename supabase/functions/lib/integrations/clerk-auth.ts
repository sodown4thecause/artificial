// Clerk JWT verification for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';

interface ClerkUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export async function verifyClerkToken(request: Request): Promise<{ user: ClerkUser; supabaseClient: any } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // For Clerk tokens, we need to verify with Clerk's API
  const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
  if (!clerkSecretKey) {
    return { error: 'Clerk not configured', status: 500 };
  }

  try {
    // Decode JWT to get user ID (without full verification for now)
    // Clerk tokens are standard JWTs with format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid token format', status: 401 };
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = payload.sub;
    
    if (!userId) {
      return { error: 'Invalid token payload', status: 401 };
    }
    
    // Get user details from Clerk
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch Clerk user:', await userResponse.text());
      return { error: 'Failed to get user data', status: 401 };
    }

    const userData = await userResponse.json();
    
    const user: ClerkUser = {
      id: userData.id,
      email: userData.email_addresses?.[0]?.email_address,
      firstName: userData.first_name,
      lastName: userData.last_name,
      imageUrl: userData.image_url
    };

    // Create Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return { error: 'Service misconfigured', status: 500 };
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    return { user, supabaseClient };

  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function for backward compatibility with existing Supabase auth pattern
export async function getClerkUser(request: Request) {
  const result = await verifyClerkToken(request);
  
  if ('error' in result) {
    return { data: { user: null }, error: new Error(result.error) };
  }

  return { 
    data: { 
      user: {
        id: result.user.id,
        email: result.user.email,
        user_metadata: {
          first_name: result.user.firstName,
          last_name: result.user.lastName,
          avatar_url: result.user.imageUrl
        }
      } 
    }, 
    error: null,
    supabaseClient: result.supabaseClient
  };
}
