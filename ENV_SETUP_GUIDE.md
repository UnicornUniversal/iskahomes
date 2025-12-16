# Environment Variables Setup Guide

## 📋 Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

# Public URL (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Anon/Public key (safe to expose to client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (KEEP SECRET! Server-side only)
# ⚠️ NEVER prefix this with NEXT_PUBLIC_ - it's a secret!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# EMAIL CONFIGURATION (SendGrid + Resend)
# ============================================
# The system tries SendGrid first, then falls back to Resend if SendGrid fails

# SendGrid Configuration (Primary)
# Get these from: https://sendgrid.com
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Iska Homes

# Resend Configuration (Fallback)
# Get these from: https://resend.com
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Optional, will use SENDGRID_FROM_EMAIL if not set
RESEND_FROM_NAME=Iska Homes  # Optional, will use SENDGRID_FROM_NAME if not set

# ============================================
# FRONTEND CONFIGURATION
# ============================================
# Your frontend URL (used in email verification links)
NEXT_PUBLIC_FRONTEND_URL=https://iskahomes.vercel.app/
FRONTEND_LINK=https://iskahomes.vercel.app/

# ============================================
# GOOGLE MAPS API (if using)
# ============================================
NEXT_PUBLIC_GOOGLE_MAPS_API=your-google-maps-api-key

# ============================================
# POSTHOG ANALYTICS (if using)
# ============================================
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 🔑 How to Get Each Key

### 1. Supabase Keys

1. Go to your Supabase project: https://app.supabase.com
2. Click on your project
3. Go to **Settings** (⚙️ icon) → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

### 2. Email Provider Keys

#### SendGrid (Primary Provider)

1. Go to: https://sendgrid.com
2. Sign up or log in
3. **Create API Key:**
   - Go to **Settings** → **API Keys**
   - Click "Create API Key"
   - Name it (e.g., "Iska Homes Production")
   - Select **Full Access** or **Restricted Access** (Mail Send only)
   - Copy the key (starts with `SG.`)
   - Paste into `SENDGRID_API_KEY`

4. **Verify Sender Email:**
   - Go to **Settings** → **Sender Authentication**
   - Click "Verify a Single Sender"
   - Fill in your email and details
   - Check your email and click verification link
   - Use this verified email for `SENDGRID_FROM_EMAIL`

#### Resend (Fallback Provider)

1. Go to: https://resend.com
2. Sign up or log in
3. **Create API Key:**
   - Go to **API Keys** section
   - Click "Create API Key"
   - Name it (e.g., "Iska Homes Production")
   - Copy the key (starts with `re_`)
   - Paste into `RESEND_API_KEY`

4. **Verify Domain (Recommended) or Use Default:**
   - Go to **Domains** section
   - Add and verify your domain (recommended for production)
   - Or use the default `onboarding@resend.dev` for testing
   - Use your verified email for `RESEND_FROM_EMAIL` (optional, will use `SENDGRID_FROM_EMAIL` if not set)

**Note:** The system automatically uses Resend as a fallback if SendGrid fails. You only need Resend configured if you want the fallback functionality.

### 3. Frontend URLs

For development:
```env
NEXT_PUBLIC_FRONTEND_URL=https://iskahomes.vercel.app/
FRONTEND_LINK=https://iskahomes.vercel.app/
```

For production:
```env
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
FRONTEND_LINK=https://yourdomain.com
```

---

## ⚠️ Security Notes

### NEVER expose these in client-side code:
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `SENDGRID_API_KEY`
- ❌ `RESEND_API_KEY`

### Safe to expose (NEXT_PUBLIC_ prefix):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_FRONTEND_URL`
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API`
- ✅ `NEXT_PUBLIC_POSTHOG_KEY`

---

## 🧪 Testing Your Setup

After adding all env variables:

1. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Check if variables are loaded:**
   - Open your browser console
   - The app should start without errors
   - No "Missing environment variable" errors

3. **Test signup:**
   - Go to `/signup`
   - Fill in the form
   - Submit
   - Check your email

---

## 🐛 Troubleshooting

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Fix:** Make sure `.env.local` is in the project root and contains this variable

### Error: "Failed to create user account"
**Fix:** Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly (without `NEXT_PUBLIC_` prefix)

### Error: "Failed to send verification email"
**Fix:** 
- Verify SendGrid API key is correct
- Verify sender email is verified in SendGrid
- Check SendGrid activity log
- If SendGrid fails, the system will automatically try Resend (if configured)
- Verify Resend API key is correct if using fallback

### Emails not sending
**Fix:**
1. **For SendGrid:**
   - Go to SendGrid dashboard
   - Check "Activity" tab
   - Look for bounces or blocks
   - Verify sender email is verified

2. **For Resend (if SendGrid fails):**
   - Go to Resend dashboard
   - Check "Logs" section
   - Verify domain/email is verified
   - Check API key permissions

3. **Test the email functionality:**
   - Go to `/another` page
   - Use the email test form
   - Check which provider was used (SendGrid or Resend)
   - Review error messages if both fail

---

## 📝 Quick Copy-Paste Template

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email Providers (SendGrid primary, Resend fallback)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=Iska Homes
RESEND_API_KEY=
RESEND_FROM_EMAIL=  # Optional
RESEND_FROM_NAME=Iska Homes  # Optional

# Frontend
NEXT_PUBLIC_FRONTEND_URL=https://iskahomes.vercel.app/
FRONTEND_LINK=https://iskahomes.vercel.app/
```

Fill in the empty values with your keys!

---

## ✅ Checklist

- [ ] Created `.env.local` file
- [ ] Added all Supabase keys
- [ ] Added SendGrid API key (primary)
- [ ] Verified sender email in SendGrid
- [ ] Added Resend API key (optional, for fallback)
- [ ] Added frontend URLs
- [ ] Restarted dev server
- [ ] Tested email functionality at `/another` page
- [ ] Tested signup flow
- [ ] Received verification email

---

**Once all environment variables are set, try signing up again!** 🚀

