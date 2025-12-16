'use client'

import { handleAuthFailure } from '@/lib/authFailureHandler';

/**
 * Hook to handle API errors, especially auth failures
 * Use this in components that make API calls
 */
export const useApiErrorHandler = () => {
  const router = useRouter();

  const handleApiError = async (error, response) => {
    // Check if it's an auth failure
    if (response?.status === 401 || response?.status === 403) {
      try {
        const errorData = await response?.json();
        if (errorData?.auth_failed || errorData?.error?.includes('Unauthorized') || errorData?.error?.includes('Authentication')) {
          // Auth failure detected - logout and redirect
          await handleAuthFailure('/home/signin');
          return;
        }
      } catch (e) {
        // If we can't parse the error, but it's 401/403, still logout
        await handleAuthFailure('/home/signin');
        return;
      }
    }

    // For other errors, you can handle them here or let the component handle them
    throw error;
  };

  return { handleApiError };
};

/**
 * Wrapper function for fetch that automatically handles auth failures
 */
export const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Check for auth failures
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData?.auth_failed || 
          errorData?.error?.includes('Unauthorized') || 
          errorData?.error?.includes('Authentication') ||
          errorData?.error?.includes('Token')) {
        // Auth failure - logout and redirect
        await handleAuthFailure('/home/signin');
        return response; // Return the response anyway so caller can handle it
      }
    }

    return response;
  } catch (error) {
    // Network errors or other fetch errors
    throw error;
  }
};

