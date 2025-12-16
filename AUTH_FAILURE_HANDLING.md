# Authentication Failure Handling

This document describes the authentication failure handling system that automatically logs out users, clears tokens, and redirects to the login page when authentication fails.

## Overview

When authentication fails anywhere in the application, the system will:
1. **Logout the user** - Clear user session
2. **Clear all tokens** - Remove all authentication tokens from localStorage
3. **Redirect to login** - Automatically redirect to `/home/signin` page

## Implementation

### Client-Side Handler

**File**: `src/lib/authFailureHandler.js`

The `handleAuthFailure()` function handles client-side auth failures:

```javascript
import { handleAuthFailure } from '@/lib/authFailureHandler';

// When auth fails, call this function
await handleAuthFailure('/home/signin');
```

This function:
- Clears all tokens from localStorage (developer_token, property_seeker_token, agent_token, etc.)
- Calls the logout API for server-side cleanup
- Redirects to the signin page

### Server-Side Handler

**File**: `src/lib/authFailureHandler.server.js`

For API routes, use `createAuthFailureResponse()`:

```javascript
import { createAuthFailureResponse } from '@/lib/authFailureHandler.server';

// In your API route
if (!decoded || !decoded.user_id) {
  return createAuthFailureResponse('Invalid or expired token');
}
```

This returns a 401 response with `auth_failed: true` flag that the client will detect and handle.

## Where It's Implemented

### 1. AuthContext (`src/contexts/AuthContext.jsx`)

The `loadUser()` function now handles auth failures:
- Invalid tokens
- Expired tokens
- Database errors when fetching user profile
- Token verification failures

All these scenarios will trigger automatic logout and redirect.

### 2. API Routes

API routes should return responses with `auth_failed: true` when authentication fails:

```javascript
// Example from src/app/api/listings/route.js
if (!decoded || !decoded.user_id) {
  return NextResponse.json(
    { 
      error: 'Invalid or expired token',
      auth_failed: true // This flag triggers client-side logout
    },
    { status: 401 }
  );
}
```

### 3. Client-Side API Calls

Use the `fetchWithAuth` wrapper or `useApiErrorHandler` hook to automatically handle auth failures:

```javascript
import { fetchWithAuth } from '@/hooks/useApiErrorHandler';

// This will automatically handle 401/403 responses
const response = await fetchWithAuth('/api/some-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

Or use the hook:

```javascript
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

function MyComponent() {
  const { handleApiError } = useApiErrorHandler();
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) {
        await handleApiError(null, response);
      }
    } catch (error) {
      // Handle error
    }
  };
}
```

## Token Types Handled

The system clears all these tokens:
- `developer_token`
- `property_seeker_token`
- `agent_token`
- `admin_token`
- `homeowner_token`
- `homeseeker_token`

## Scenarios Covered

1. **Token Expiration**: When JWT token expires
2. **Invalid Token**: When token is malformed or invalid
3. **User Not Found**: When user profile doesn't exist in database
4. **Database Errors**: When database queries fail due to permissions
5. **API Auth Failures**: When API routes return 401/403 with `auth_failed` flag

## Testing

To test auth failure handling:

1. **Expired Token**: Wait for token to expire, then make an API call
2. **Invalid Token**: Manually corrupt the token in localStorage
3. **User Deleted**: Delete user from database, then try to use the app
4. **API 401 Response**: Make an API call with invalid token

All scenarios should automatically logout and redirect to `/home/signin`.

## Customization

### Change Redirect URL

```javascript
// In AuthContext or any component
await handleAuthFailure('/custom-login-page');
```

### Add Custom Cleanup

Modify `handleAuthFailure()` in `src/lib/authFailureHandler.js` to add custom cleanup logic before redirect.

## Security Benefits

1. **Automatic Cleanup**: Prevents users from being stuck in invalid sessions
2. **Token Security**: Ensures all tokens are cleared on auth failure
3. **User Experience**: Smooth redirect to login instead of error screens
4. **Consistent Behavior**: Same handling across all auth failure scenarios

