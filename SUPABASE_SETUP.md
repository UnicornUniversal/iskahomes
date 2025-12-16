# Supabase Authentication Setup Guide

## 📦 Required NPM Packages

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## 🔧 Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to get these values:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `NEXT_PUBLIC_SERVICE_ROLE_KEY`

## 🗄️ Database Tables Required

Run the SQL commands from the previous conversation to create:
- `developers` table
- `agents` table  
- `home_seekers` table
- `subscription_plans` table
- `developer_subscriptions` table
- And all related tables

## 🚀 How It Works

### 1. User Signup Flow
```
User fills form → API call to /api/auth/signup → 
Supabase Auth creates user → Developer record created in database → 
Redirect to dashboard
```

### 2. User Signin Flow
```
User fills form → API call to /api/auth/home/signin → 
Supabase Auth validates → Get user profile → 
Redirect to appropriate dashboard
```

### 3. File Structure Created
```
src/
├── lib/
│   ├── supabase.js          # Supabase client configuration
│   ├── auth.js              # Authentication functions
│   └── database.js          # Database operations
├── app/
│   ├── api/auth/
│   │   ├── signup/route.js  # Signup API endpoint
│   │   ├── signin/route.js  # Signin API endpoint
│   │   └── signout/route.js # Signout API endpoint
│   ├── signin/page.jsx      # Signin page
│   └── signup/page.jsx      # Updated signup page
└── middleware.js            # Route protection
```

## 🔐 Authentication Features

### ✅ What's Included:
- **Supabase Auth Integration** - Secure user authentication
- **Multi-user Type Support** - Developer, Agent, Home Seeker
- **Automatic Profile Creation** - Creates profile records on signup
- **Route Protection** - Middleware protects authenticated routes
- **Session Management** - Handles login/logout sessions
- **Error Handling** - Comprehensive error messages

### 🎯 Developer Signup Process:
1. User fills developer signup form
2. Creates account in `auth.users` table
3. Creates developer profile in `developers` table
4. Redirects to developer dashboard

## 🧪 Testing the Setup

1. **Install packages**: `npm install @supabase/supabase-js @supabase/auth-helpers-nextjs`
2. **Set environment variables** in `.env.local`
3. **Create database tables** using the SQL schema
4. **Start development server**: `npm run dev`
5. **Test signup**: Go to `/signup` and select "Developer" tab
6. **Test signin**: Go to `/home/signin` with created credentials

## 🔄 Next Steps

After successful signup, users can:
- Complete their profile in the developer dashboard
- Add subscription plans
- Manage their properties
- Update billing information

## 🛠️ Troubleshooting

### Common Issues:
1. **Environment variables not loaded** - Restart dev server after adding `.env.local`
2. **Database connection errors** - Check Supabase URL and keys
3. **CORS issues** - Ensure Supabase project allows your domain
4. **Table not found** - Run the SQL schema creation commands

### Debug Tips:
- Check browser console for API errors
- Check Supabase logs in dashboard
- Verify environment variables are loaded
- Test API endpoints directly with Postman/curl
