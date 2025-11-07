# Property Seeker Authentication Setup

This document outlines the complete authentication system for property seekers in the Iska Homes application.

## Overview

Property seekers have a separate authentication flow from developers and agents, using their own token (`property_seeker_token`) stored in localStorage.

---

## Authentication Flow

### 1. **Sign Up**
- User signs up at `/signup` with `userType: 'property_seeker'`
- Account created in Supabase Auth
- Profile created in `property_seekers` table
- Verification email sent via SendGrid
- Status set to `'active'` by default

### 2. **Email Verification**
- User clicks verification link in email
- Token verified via `/api/auth/verify-email`
- Supabase Auth `email_confirmed_at` updated
- Profile `is_verified` set to `true`
- Welcome email sent

### 3. **Sign In**
- User signs in at `/signin`
- Credentials verified with Supabase Auth
- Profile fetched from `property_seekers` table
- JWT token generated with:
  ```javascript
  {
    id: profile.id,        // property_seeker table id
    user_id: user.id,      // Supabase Auth user id
    email: user.email,
    user_type: 'property_seeker'
  }
  ```
- Token stored as `property_seeker_token` in localStorage
- User redirected to `/propertySeeker/{id}/dashboard`

---

## Token Storage

### Developer Token
- Key: `developer_token`
- Contains: `developer_id`, `user_id`, `email`, `user_type`

### Property Seeker Token
- Key: `property_seeker_token`
- Contains: `id` (from property_seekers table), `user_id`, `email`, `user_type`

### Important Notes
- Only ONE token is active at a time
- Tokens are mutually exclusive (developer OR property_seeker, not both)
- Token type determines which dashboard the user sees

---

## AuthContext Integration

### State Management
```javascript
const [developerToken, setDeveloperToken] = useState('')
const [propertySeekerToken, setPropertySeekerToken] = useState('')
```

### loadUser() Function
- Checks for `developer_token` first
- If not found, checks for `property_seeker_token`
- Verifies token with JWT
- Fetches profile from appropriate table
- Sets user state with profile data

### login() Function
- Handles both developer and property_seeker logins
- Stores appropriate token based on user type
- Sets user state
- Tracks login with PostHog
- Returns success/error

### logout() Function
- Clears BOTH tokens from localStorage
- Resets user state
- Tracks logout with PostHog

### Context Value
```javascript
{
  user,
  loading,
  developerToken,
  propertySeekerToken,
  login,
  logout,
  isAuthenticated: !!user && (!!developerToken || !!propertySeekerToken)
}
```

---

## API Routes

### `/api/auth/signup`
- Creates Supabase Auth user
- Creates profile in `property_seekers` table
- Generates verification token
- Sends verification email via SendGrid
- Sets `status: 'active'` on creation

### `/api/auth/verify-email`
- Validates verification token
- Updates Supabase Auth `email_confirmed_at`
- Updates profile `is_verified` and `status`
- Sends welcome email

### `/api/auth/signin`
- Verifies credentials with Supabase Auth
- Fetches profile from `property_seekers` table
- Generates JWT token with profile `id`
- Returns user data and token

---

## Redirect Logic

### On Sign In Success
```javascript
case 'property_seeker':
  redirectUrl = `/propertySeeker/${result.user.id}/dashboard`
  break
```

### On Already Authenticated
```javascript
case 'property_seeker':
  redirectUrl = `/propertySeeker/${user.id}/dashboard`
  break
```

### Important
- Uses `id` (from property_seekers table), NOT `slug`
- Dashboard route: `/propertySeeker/[id]/dashboard`

---

## Database Schema

### property_seekers Table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- name (text)
- email (text, unique)
- slug (text, unique)
- status (text, default 'active')
- is_verified (boolean, default false)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
... (additional fields)
```

---

## PostHog Analytics

### On Login
```javascript
posthog.identify(user.id, {
  email: user.email,
  user_type: 'property_seeker',
  name: user.profile?.name
})

posthog.capture('user_logged_in', {
  user_type: 'property_seeker',
  login_method: 'email'
})
```

### On Logout
```javascript
posthog.capture('user_logged_out')
posthog.reset()
```

---

## File Changes

### Updated Files
1. `src/contexts/AuthContext.jsx`
   - Added `propertySeekerToken` state
   - Updated `loadUser()` to handle property seekers
   - Updated `login()` to store property_seeker_token
   - Updated `logout()` to clear both tokens
   - Updated context value

2. `src/app/api/auth/signin/route.js`
   - Added property_seeker case
   - Fetches from property_seekers table
   - Generates JWT with profile.id
   - Returns appropriate profile data

3. `src/app/api/auth/verify-email/route.js`
   - Fixed import (supabaseAdmin from @/lib/supabase)
   - Handles property_seeker verification
   - Updates status to 'active'

4. `src/app/verify-email/page.jsx`
   - Removed email parameter requirement
   - Only uses token parameter

5. `src/app/signin/page.jsx`
   - Added property_seeker redirect case
   - Redirects to `/propertySeeker/${id}/dashboard`

### Existing Files (No Changes Required)
- `src/app/propertySeeker/[slug]/dashboard/page.jsx` (already exists)
- `src/app/components/homeSeeker/` (components already exist)

---

## Testing Checklist

### Sign Up Flow
- [ ] Sign up as property_seeker
- [ ] Verification email received
- [ ] Click verification link
- [ ] Verification success message shown
- [ ] Welcome email received

### Sign In Flow
- [ ] Sign in with verified account
- [ ] `property_seeker_token` stored in localStorage
- [ ] User state populated correctly
- [ ] Redirected to `/propertySeeker/{id}/dashboard`
- [ ] Dashboard displays correctly

### Authentication State
- [ ] Refresh page - user stays logged in
- [ ] Logout - both tokens cleared
- [ ] Try accessing protected routes
- [ ] AuthContext provides correct user data

### Token Handling
- [ ] Only one token type active at a time
- [ ] Token contains correct data
- [ ] Token verified on page refresh
- [ ] Token cleared on logout

---

## Troubleshooting

### "Invalid verification link"
- Check that verify-email page only requires `token` parameter
- Verify API imports `supabaseAdmin` from correct file

### "Profile not found"
- Check that signup creates profile in property_seekers table
- Verify user_id foreign key is set correctly

### "Redirect not working"
- Check that signin page has property_seeker case
- Verify using `user.id`, not `user.slug`

### "Token not stored"
- Check AuthContext login() function
- Verify localStorage.setItem('property_seeker_token') is called

---

## Future Enhancements

1. **Password Reset** - Implement forgot password flow
2. **Profile Update** - Allow property seekers to update profile
3. **Social Login** - Add Google/Facebook OAuth
4. **2FA** - Add two-factor authentication
5. **Session Management** - Implement refresh token logic

---

## Related Documentation
- `SENDGRID_SUPABASE_SETUP.md` - Email integration
- `create_property_seekers_table.sql` - Database schema
- `SIGNUP_POLICY.md` - One email per account type policy
- `POSTHOG_ANALYTICS_SETUP.md` - Analytics integration

