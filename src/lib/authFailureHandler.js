'use client'

/**
 * Handles authentication failures by:
 * 1. Logging out the user
 * 2. Clearing all tokens from storage
 * 3. Redirecting to the login page
 */

/**
 * Client-side auth failure handler
 * Use this in React components, hooks, and client-side code
 * 
 * @param {string} redirectTo - The URL to redirect to after logout (default: '/signin')
 */
export const handleAuthFailure = async (redirectTo = '/signin') => {
  try {
    // Clear all tokens from localStorage
    const tokensToRemove = [
      'developer_token',
      'property_seeker_token',
      'agent_token',
      'agency_token',
      'admin_token',
      'homeowner_token',
      'homeseeker_token'
    ];

    tokensToRemove.forEach(tokenKey => {
      localStorage.removeItem(tokenKey);
    });

    // Clear any other auth-related data
    localStorage.removeItem('user');
    localStorage.removeItem('user_type');

    // Try to call logout API (optional, but good for server-side cleanup)
    try {
      const currentToken = localStorage.getItem('developer_token') || 
                          localStorage.getItem('property_seeker_token') ||
                          localStorage.getItem('agent_token');
      
      if (currentToken) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ token: currentToken })
        });
      }
    } catch (apiError) {
      // Continue with client-side cleanup even if API fails
      console.warn('Logout API call failed during auth failure handling:', apiError);
    }

    // Redirect to signin page
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  } catch (error) {
    console.error('Error handling auth failure:', error);
    // Force redirect even if there's an error
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }
};

// Note: Server-side functions are in a separate export to avoid client-side bundling issues
// These should only be imported in API routes (server-side)

// Note: Server-side functions below should only be imported in API routes (server-side)
// They use dynamic imports to avoid client-side bundling issues

