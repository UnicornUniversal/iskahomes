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

/** auth-js has no admin.getUserByEmail; locate user via paginated admin.listUsers. */
export async function findAuthUserByEmail(email) {
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!normalized) return { user: null, error: null }

  const perPage = 1000
  const maxPages = 50

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) return { user: null, error }

    const users = data?.users ?? []
    const match = users.find((u) => (u.email || '').toLowerCase() === normalized)
    if (match) return { user: match, error: null }

    if (users.length < perPage) break
  }

  return { user: null, error: null }
}

// Export createClient for API routes
export { createClient }