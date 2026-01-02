import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Service role key should NOT have NEXT_PUBLIC_ prefix (it's a secret!)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations - requires service role key for admin operations
if (!serviceRoleKey) {
  console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || supabaseAnonKey, // Fallback to anon key if service role key is missing (will fail for admin ops)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Export createClient for API routes
export { createClient }