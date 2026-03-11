import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/[userType]/[userId]/team
 * Get team members for developers and agencies (public info only)
 * Property seekers and agents: return empty (no team)
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    if (userType === 'property_seeker' || userType === 'agent') {
      return NextResponse.json({ success: true, data: [] })
    }

    if (userType === 'developer') {
      // Get developer's internal id (developers.id) from developer_id
      const { data: dev, error: devError } = await supabaseAdmin
        .from('developers')
        .select('id')
        .eq('developer_id', userId)
        .single()

      if (devError || !dev) {
        return NextResponse.json({ success: true, data: [] })
      }

      const { data: teamMembers, error } = await supabaseAdmin
        .from('organization_team_members')
        .select(`
          id,
          email,
          first_name,
          last_name,
          status,
          organization_type,
          role_id,
          created_at,
          role:organization_roles(id, name)
        `)
        .eq('organization_type', 'developer')
        .eq('organization_id', dev.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const sanitized = (teamMembers || []).map(m => {
        const { password_hash, invitation_token, ...rest } = m
        return rest
      })

      return NextResponse.json({ success: true, data: sanitized })
    }

    if (userType === 'agency') {
      // Agency org_id is agencies.id (internal), not agency_id
      const { data: agency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', userId)
        .single()

      if (agencyError || !agency) {
        return NextResponse.json({ success: true, data: [] })
      }

      const { data: teamMembers, error } = await supabaseAdmin
        .from('organization_team_members')
        .select(`
          id,
          email,
          first_name,
          last_name,
          status,
          organization_type,
          role_id,
          created_at,
          role:organization_roles(id, name)
        `)
        .eq('organization_type', 'agency')
        .eq('organization_id', agency.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const sanitized = (teamMembers || []).map(m => {
        const { password_hash, invitation_token, ...rest } = m
        return rest
      })

      return NextResponse.json({ success: true, data: sanitized })
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error('Admin user team error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
