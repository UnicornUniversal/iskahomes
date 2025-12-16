# Property Seeker Signup - Complete Setup Guide

## ✅ What's Been Implemented

### 1. Database Schema ✅
- **`property_seekers` table** created with:
  - Personal info (name, email, phone, bio, profile_picture)
  - Location tracking (current_location)
  - Property preferences (types, categories, purposes, locations)
  - Budget preferences (min, max, currency)
  - Engagement metrics (favorites, appointments, inquiries, views)
  - Account status (status='active', is_verified, is_active)
  - Auto-generated slug from name
  
- **`seeker_favorites` table** for tracking favorited properties
- **`seeker_saved_searches` table** for saved search criteria

### 2. SendGrid Email Integration ✅
- **`src/lib/sendgrid.js`** with:
  - `sendVerificationEmail()` - Beautiful HTML email with verification link
  - `sendWelcomeEmail()` - Welcome email after verification
  
### 3. Signup API Route ✅
- **`src/app/api/auth/signup/route.js`** updated to:
  - Use Supabase Auth for user creation
  - Create profile in `property_seekers` table (not `home_seekers`)
  - Generate verification token
  - Send verification email via SendGrid
  - Handle all 3 user types (seeker, developer, agent)

### 4. Email Verification API ✅
- **`src/app/api/auth/verify-email/route.js`** created to:
  - Validate verification token
  - Confirm email in Supabase Auth
  - Update profile status to 'active'
  - Send welcome email
  
### 5. Verification Page ✅
- **`src/app/verify-email/page.jsx`** already exists with:
  - Loading state
  - Success state
  - Error state
  - Auto-redirect to signin after verification

---

## 🔧 Environment Variables Required

Add these to your `.env.local`:

```env
# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=https://iskahomes.vercel.app/
FRONTEND_LINK=https://iskahomes.vercel.app/

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Iska Homes

# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📋 Steps to Test Property Seeker Signup

### Step 1: Setup Database ✅ (You already did this!)
- Run the SQL in `create_property_seekers_table.sql` in your Supabase SQL Editor

### Step 2: Configure SendGrid
1. Go to [SendGrid](https://sendgrid.com)
2. Create account / Sign in
3. Generate API Key (Settings → API Keys)
4. Verify sender email (Settings → Sender Authentication)
5. Add env variables to `.env.local`

### Step 3: Test Signup Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to signup page:**
   ```
   https://iskahomes.vercel.app//signup
   ```

3. **Fill in the Property Seeker form:**
   - Full Name: Test User
   - Email: your-test-email@example.com
   - Phone: +233123456789
   - Password: Test@12345

4. **Submit the form**
   - Should see success message
   - Check your email for verification link

5. **Click verification link in email**
   - Should redirect to `/verify-email?token=xxx`
   - Should see "Email Verified!" message
   - Status changes from 'pending' to 'active' in database

6. **Sign in:**
   ```
   https://iskahomes.vercel.app//home/signin
   ```
   - Use the email and password
   - Should successfully log in

---

## 🔍 What Happens When User Signs Up

1. **User fills signup form** → Clicks "Create Account"

2. **API creates Supabase Auth user**:
   - Email: `user@example.com`
   - Password: hashed by Supabase
   - email_confirmed: `false` (initially)
   - user_metadata: `{ user_type, full_name, phone, verification_token }`

3. **API creates property_seeker profile**:
   ```sql
   INSERT INTO property_seekers (
     user_id,
     name,
     email,
     phone,
     status,
     is_verified,
     is_active
   ) VALUES (
     'auth-user-id',
     'Test User',
     'user@example.com',
     '+233123456789',
     'pending',  -- Initially pending
     false,      -- Not verified yet
     true        -- Account is active
   );
   ```

4. **SendGrid sends verification email**:
   - Beautiful HTML template
   - Verification link: `https://iskahomes.vercel.app//verify-email?token=xxx`
   - Expires in 24 hours (customizable)

5. **User clicks verification link**:
   - Opens `/verify-email` page
   - Page calls `/api/auth/verify-email`
   - API verifies token
   - Updates Supabase Auth: `email_confirm = true`
   - Updates property_seeker: `status = 'active'`, `is_verified = true`
   - Sends welcome email

6. **User can now sign in**:
   - Go to `/home/signin`
   - Enter email + password
   - Supabase Auth validates
   - User is logged in

---

## 📊 Database Schema Overview

```sql
auth.users (Supabase Auth)
├── id (UUID)
├── email
├── encrypted_password (Supabase handles this)
├── email_confirmed_at (NULL until verified)
└── user_metadata
    ├── user_type: 'seeker'
    ├── full_name: 'Test User'
    ├── phone: '+233123456789'
    └── verification_token: 'abc123...'

property_seekers (Your table)
├── id (UUID)
├── user_id (FK → auth.users.id)
├── name
├── email
├── phone
├── status ('pending' → 'active' after verification)
├── is_verified (false → true after verification)
├── is_active (true)
├── current_location (JSONB)
├── preferred_property_types (JSONB)
├── preferred_locations (JSONB)
├── budget_min, budget_max
├── total_favorites, total_appointments
├── slug (auto-generated)
└── timestamps
```

---

## 🐛 Troubleshooting

### Issue: "Failed to create user account"
**Solution:** Check if:
- Supabase service role key is correct
- Email doesn't already exist
- Password meets requirements (min 6 chars)

### Issue: "Failed to create user profile"
**Solution:** Check if:
- `property_seekers` table exists
- RLS policies are set correctly
- Run the SQL file again

### Issue: "Verification email not sent"
**Solution:** Check if:
- SendGrid API key is valid
- Sender email is verified in SendGrid
- Check SendGrid activity log

### Issue: "Invalid verification token"
**Solution:** Check if:
- Token was copied correctly
- Link hasn't expired (24 hours)
- User already verified

---

## 🔐 Security Features

1. **Password Hashing**: Supabase Auth uses bcrypt
2. **Email Verification**: Required before account activation
3. **Token Expiry**: Verification links expire
4. **RLS Policies**: Row Level Security on all tables
5. **Status Tracking**: 'pending' → 'active' workflow
6. **Cleanup**: If profile creation fails, auth user is deleted

---

## 📈 Next Steps

After signup works, you can:

1. **Create seeker dashboard**:
   - View saved properties
   - Manage preferences
   - Track appointments

2. **Add preference setup**:
   - Onboarding flow after signup
   - Set budget, locations, property types

3. **Implement favorites system**:
   - Save listings to `seeker_favorites`
   - Analytics tracking

4. **Add saved searches**:
   - Store search criteria
   - Email notifications for new matches

5. **Build messaging system**:
   - Connect with agents/developers
   - Track inquiries

---

## ✅ Testing Checklist

- [ ] User can fill signup form
- [ ] User receives verification email
- [ ] Verification link works
- [ ] Status changes to 'active' after verification
- [ ] Welcome email is sent
- [ ] User can sign in after verification
- [ ] User cannot sign in before verification
- [ ] Profile data is correctly saved
- [ ] Slug is auto-generated from name
- [ ] Error handling works (duplicate email, etc.)

---

## 📧 Email Templates Preview

### Verification Email:
- Subject: "Verify Your Iska Homes Account"
- Purple gradient header
- Big "Verify Email Address" button
- Fallback text link
- Professional footer

### Welcome Email:
- Subject: "Welcome to Iska Homes - Your Account is Ready!"
- 🎉 celebration theme
- List of features for seekers
- "Sign In Now" button
- Get started guide

---

**Status: ✅ COMPLETE & READY FOR TESTING**

You can now test the property seeker signup flow! 🎉

