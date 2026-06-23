import { supabaseAdmin, findAuthUserByEmail } from '@/lib/supabase'

const PROFILE_EMAIL_TABLES = ['developers', 'agencies', 'agents', 'property_seekers']
const ACTIVE_TEAM_MEMBER_STATUSES = ['pending', 'active', 'suspended']

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

/**
 * Ensure an email is not already used by another platform account before inviting
 * someone as a team member or agent.
 */
export async function checkEmailAvailableForInvitation(email, options = {}) {
  const normalizedEmail = normalizeEmail(email)
  const { ignoreAgentId = null, ignoreTeamMemberId = null } = options

  if (!normalizedEmail) {
    return { available: false, message: 'Email is required' }
  }

  const { user: authUser, error: authError } = await findAuthUserByEmail(normalizedEmail)
  if (authError) {
    console.error('Email availability auth lookup failed:', authError)
    return { available: null, message: 'Unable to validate email. Please try again.' }
  }

  if (authUser) {
    return {
      available: false,
      message: 'An account with this email already exists. Please sign in instead.',
    }
  }

  for (const table of PROFILE_EMAIL_TABLES) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('id')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(`Email availability ${table} lookup failed:`, error)
      return { available: null, message: 'Unable to validate email. Please try again.' }
    }

    if (data?.id) {
      if (table === 'agents' && ignoreAgentId && data.id === ignoreAgentId) {
        continue
      }

      return {
        available: false,
        message: 'An account with this email already exists on the platform.',
      }
    }
  }

  const { data: teamMembers, error: teamError } = await supabaseAdmin
    .from('organization_team_members')
    .select('id')
    .ilike('email', normalizedEmail)
    .in('status', ACTIVE_TEAM_MEMBER_STATUSES)

  if (teamError) {
    console.error('Email availability team member lookup failed:', teamError)
    return { available: null, message: 'Unable to validate email. Please try again.' }
  }

  const conflictingTeamMember = (teamMembers || []).find(
    (member) => !(ignoreTeamMemberId && member.id === ignoreTeamMemberId)
  )

  if (conflictingTeamMember) {
    return {
      available: false,
      message: 'This email is already associated with a team member account.',
    }
  }

  return { available: true }
}
