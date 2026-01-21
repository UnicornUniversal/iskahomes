import { supabaseAdmin } from './supabase'

/**
 * Gets the actual developer_id (user_id from auth.users) for a user
 * For team members, fetches from developers table using organization_id
 * For developers, returns their user_id directly
 * @param {Object} userInfo - User info from authenticateRequest
 * @returns {Promise<string|null>} - The developer_id (user_id) or null if not found
 */
export async function getDeveloperId(userInfo) {
  if (!userInfo) return null

  // If user is a developer, return their user_id directly
  if (userInfo.user_type === 'developer') {
    return userInfo.user_id
  }

  // If user is a team member with developer organization, fetch developer_id
  if (userInfo.user_type === 'team_member' && userInfo.organization_type === 'developer') {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('developer_id')
      .eq('id', userInfo.organization_id)
      .single()

    return developer?.developer_id || null
  }

  return null
}
