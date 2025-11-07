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
# SENDGRID EMAIL CONFIGURATION
# ============================================
# Get these from: https://sendgrid.com

# SendGrid API Key (starts with SG.)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# Verified sender email (must be verified in SendGrid)
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Sender name that appears in emails
SENDGRID_FROM_NAME=Iska Homes

# ============================================
# FRONTEND CONFIGURATION
# ============================================
# Your frontend URL (used in email verification links)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
FRONTEND_LINK=http://localhost:3000

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

### 2. SendGrid Keys

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

### 3. Frontend URLs

For development:
```env
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
FRONTEND_LINK=http://localhost:3000
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

### Emails not sending
**Fix:**
1. Go to SendGrid dashboard
2. Check "Activity" tab
3. Look for bounces or blocks
4. Verify sender email is verified

---

## 📝 Quick Copy-Paste Template

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=Iska Homes

# Frontend
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
FRONTEND_LINK=http://localhost:3000
```

Fill in the empty values with your keys!

---

## ✅ Checklist

- [ ] Created `.env.local` file
- [ ] Added all Supabase keys
- [ ] Added SendGrid API key
- [ ] Verified sender email in SendGrid
- [ ] Added frontend URLs
- [ ] Restarted dev server
- [ ] Tested signup flow
- [ ] Received verification email

---

**Once all environment variables are set, try signing up again!** 🚀

