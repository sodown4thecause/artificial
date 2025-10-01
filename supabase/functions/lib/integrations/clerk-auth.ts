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
  // Try to get token from custom header first (bypasses Supabase JWT validation)
  let token = request.headers.get('x-clerk-token');

  console.log('Clerk token from x-clerk-token header:', token ? 'Present' : 'Missing');
  
  if (!token) {
    // Fallback to Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    if (!authHeader) {
      console.error('No token found in headers');
      return { error: 'Unauthorized - No token provided', status: 401 };
    }
    token = authHeader.replace('Bearer ', '');
  }
  
  if (!token || token.trim() === '') {
    console.error('Token is empty after extraction');
    return { error: 'Unauthorized - Empty token', status: 401 };
  }
  
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
      console.error('Invalid token format - not 3 parts. Got', parts.length, 'parts');
      console.error('Token preview:', token.substring(0, 50));
      return { error: 'Invalid JWT format - expected 3 parts, got ' + parts.length, status: 401 };
    }
    
    let payload;
    try {
      // Base64 decode the payload (Deno-compatible)
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Pad the base64 string if needed
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
      // Decode using Deno's decoder
      const decoder = new TextDecoder();
      const uint8Array = Uint8Array.from(
        globalThis.atob(paddedPayload),
        (c) => c.charCodeAt(0)
      );
      const jsonString = decoder.decode(uint8Array);
      payload = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to decode token payload:', e);
      console.error('Token parts[1] preview:', parts[1]?.substring(0, 50));
      return { error: 'Invalid JWT encoding - ' + e.message, status: 401 };
    }
    
    const userId = payload.sub;
    console.log('Decoded Clerk token for user:', userId);
    console.log('Token payload keys:', Object.keys(payload));
    
    if (!userId) {
      console.error('No user ID in token payload');
      console.error('Payload:', JSON.stringify(payload));
      return { error: 'Invalid JWT - missing user ID (sub claim)', status: 401 };
    }
    
    // Get user details from Clerk
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Failed to fetch Clerk user:', userResponse.status, errorText);
      return { error: 'Failed to get user data', status: 401 };
    }

    const userData = await userResponse.json();
    console.log('Fetched Clerk user data for:', userData.id);
    
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
