import { Clerk } from '@clerk/clerk-react';

// Initialize Clerk with publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Clerk publishable key is missing. Set VITE_CLERK_PUBLISHABLE_KEY environment variable.');
}

// Export a singleton instance
export const clerk = clerkPubKey ? new Clerk(clerkPubKey) : null;
