import { supabase } from './supabase'

// Get user type from auth metadata
export const getUserType = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { userType: null, error }
    }

    // Get user type from metadata
    const userType = user.user_metadata?.user_type || null
    
    return { userType, user, error: null }
  } catch (error) {
    return { userType: null, user: null, error }
  }
}

// Check if user is a specific type
export const isUserType = async (expectedType) => {
  const { userType } = await getUserType()
  return userType === expectedType
}

// Get user profile based on type
export const getUserProfile = async () => {
  try {
    const { userType, user, error } = await getUserType()
    
    if (error || !user || !userType) {
      return { profile: null, userType: null, error }
    }

    let profile = null

    switch (userType) {
      case 'developer':
        const { data: devProfile } = await supabase
          .from('developers')
          .select('*')
          .eq('developer_id', user.id)
          .single()
        profile = devProfile
        break

      case 'agent':
        const { data: agentProfile } = await supabase
          .from('agents')
          .select('*')
          .eq('developer_id', user.id)
          .single()
        profile = agentProfile
        break

      case 'seeker':
        const { data: seekerProfile } = await supabase
          .from('home_seekers')
          .select('*')
          .eq('developer_id', user.id)
          .single()
        profile = seekerProfile
        break

      case 'admin':
        // Admin might not have a separate profile table
        profile = { id: user.id, name: user.user_metadata?.full_name, email: user.email }
        break

      default:
        return { profile: null, userType: null, error: 'Unknown user type' }
    }

    return { profile, userType, error: null }
  } catch (error) {
    return { profile: null, userType: null, error }
  }
}

// Redirect user to appropriate dashboard
export const redirectToDashboard = (userType, profile) => {
  switch (userType) {
    case 'developer':
      return `/developer/${profile.slug}/dashboard`
    case 'agent':
      return `/agents/${profile.slug}/dashboard`
    case 'seeker':
      return `/homeSeeker/${profile.slug}/dashboard`
    case 'admin':
      return `/admin/dashboard`
    default:
      return '/'
  }
}
