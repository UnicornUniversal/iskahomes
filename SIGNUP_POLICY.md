# Iska Homes - Signup & Account Policy

## 📋 Account Policy

### One Email = One Account Type

**Policy:** Each email address can only be registered once across the entire platform.

**Example:**
- ✅ `john@example.com` signs up as **Developer** → Success
- ❌ `john@example.com` tries to sign up as **Property Seeker** → Error: "A user with this email address has already been registered"
- ❌ `john@example.com` tries to sign up as **Agent** → Error: "A user with this email address has already been registered"

---

## 🎯 Account Types

Users must choose ONE account type during registration:

1. **Property Seeker** (`property_seeker`)
   - Browse and search properties
   - Save favorites
   - Book appointments
   - Contact agents/developers

2. **Agent** (`agent`)
   - List properties for clients
   - Manage client relationships
   - Track commissions

3. **Developer** (`developer`)
   - Create developments
   - List multiple units
   - Manage projects
   - View analytics

---

## 🔐 Why This Policy?

### Benefits:
1. **Clear User Identity**: Each user has one role
2. **Simpler Authentication**: No confusion about which account to login to
3. **Better Security**: Reduced attack surface
4. **Easier Management**: One profile per user
5. **Clean Analytics**: User behavior tied to one account type

### Alternative (Not Implemented):
If a user needs multiple roles, they should:
- Use different email addresses for each role
- Example: 
  - `john@example.com` → Developer account
  - `john.personal@gmail.com` → Property Seeker account

---

## ⚠️ Error Messages

### Duplicate Email:
```
"A user with this email address has already been registered"
```

**User Action:**
- Use a different email address, OR
- Sign in with existing account, OR
- Contact support if they forgot their account type

### Invalid User Type:
```
"Invalid user type. Must be: developer, agent, or property_seeker"
```

### Missing Fields:
```
"Missing required fields: email, password, userType"
```

---

## 🎨 User Experience

### Signup Flow:
1. User visits `/signup`
2. Chooses account type (Property Seeker, Agent, Developer)
3. Fills in form
4. Clicks "Create Account"
5. System checks if email already exists
6. **If email exists:** Show error alert with specific message
7. **If email is new:** Create account and send verification email

### Error Display:
- **Alert popup** with specific error message
- **Toast notification** for additional visual feedback
- **Console log** for debugging

---

## 🔄 Account Status Flow

```
Registration → status: 'active'
     ↓
Email sent → verification link
     ↓
User clicks link → is_verified: true
     ↓
Welcome email sent → User can sign in
```

**Note:** Users can sign in immediately after registration, even before email verification (you can change this policy if needed).

---

## 🛠️ Implementation Details

### Database:
- **auth.users** table: Stores email (unique constraint)
- **property_seekers** table: Links to auth.users via user_id
- **developers** table: Links to auth.users via user_id
- **agents** table: Links to auth.users via user_id

### Constraints:
```sql
-- Email is unique in auth.users (Supabase Auth enforces this)
-- Each profile table has unique user_id constraint
-- One user_id can only exist in ONE profile table
```

---

## 📊 Account Type Distribution

Track which account types are most common:

```sql
-- Count by account type
SELECT 
  raw_user_meta_data->>'user_type' as account_type,
  COUNT(*) as total_users
FROM auth.users
GROUP BY raw_user_meta_data->>'user_type';
```

---

## 🔮 Future Considerations

If you later want to allow multiple account types per email:

### Option A: Multi-Role Accounts
- Add a `roles` JSONB array to user_metadata
- User can have multiple profiles
- Login shows account switcher

### Option B: Primary + Secondary Accounts
- User picks primary account type
- Can add secondary roles later
- Separate dashboards for each role

### Option C: Business Accounts
- Companies can have multiple users
- One company account, many sub-users
- Different roles within company

**Current Implementation:** Option 1 (One Email = One Account Type)

---

## ✅ Testing

### Test Case 1: New User
1. Sign up with `newuser@example.com` as Property Seeker
2. **Expected:** Success, verification email sent

### Test Case 2: Duplicate Email
1. Sign up with existing email as different account type
2. **Expected:** Error alert: "A user with this email address has already been registered"

### Test Case 3: Same Account Type
1. Sign up with existing email as same account type
2. **Expected:** Same error as Test Case 2

---

## 📞 Support Scenarios

### User: "I signed up as Developer but want to be a Property Seeker"

**Solution Options:**
1. **Delete and Re-register** (if no data yet):
   - Admin deletes their account
   - User re-registers with same email as Property Seeker

2. **Use Different Email**:
   - User signs up with a different email
   - Keeps developer account separate

3. **Manual Migration** (if needed):
   - Admin manually changes user_type in database
   - Moves profile data between tables

---

## 🔐 Security Notes

- Email uniqueness enforced by Supabase Auth
- Password hashed by Supabase (bcrypt)
- Email verification optional but recommended
- RLS policies prevent unauthorized access
- Service role key required for signup API

---

**Policy Version:** 1.0  
**Last Updated:** October 2025  
**Status:** ✅ Active

