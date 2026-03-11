import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const orgType = userInfo.organization_type || userInfo.user_type
    const isDeveloper = orgType === 'developer'
    const isAgency = orgType === 'agency'
    const isTeamMember = userInfo.user_type === 'team_member'

    if (!isDeveloper && !isAgency && !isTeamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const users = []

    if (isDeveloper) {
      let developerId = userInfo.developer_id || userInfo.user_id
      if (!developerId && userInfo.organization_id) {
        const { data: dev } = await supabaseAdmin
          .from('developers')
          .select('developer_id')
          .eq('id', userInfo.organization_id)
          .single()
        developerId = dev?.developer_id
      }
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id, name')
        .eq('developer_id', developerId)
        .single()
      if (developer) {
        users.push({
          user_id: developer.developer_id,
          name: developer.name || 'Owner',
          role: 'Owner',
          type: 'developer'
        })
      }
      const { data: teamMembers } = await supabaseAdmin
        .from('organization_team_members')
        .select('user_id, first_name, last_name, email, role:organization_roles(name)')
        .eq('organization_type', 'developer')
        .eq('organization_id', userInfo.organization_id)
        .eq('status', 'active')
      ;(teamMembers || []).forEach(m => {
        if (m.user_id) {
          const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || 'Team Member'
          users.push({
            user_id: m.user_id,
            name,
            role: m.role?.name || 'Team Member',
            type: 'team_member'
          })
        }
      })
    }

    if (isAgency) {
      let agencyId = userInfo.agency_id || userInfo.user_id
      if (!agencyId && userInfo.organization_id) {
        const { data: ag } = await supabaseAdmin
          .from('agencies')
          .select('agency_id')
          .eq('id', userInfo.organization_id)
          .single()
        agencyId = ag?.agency_id
      }
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('agency_id, name')
        .eq('agency_id', agencyId)
        .single()
      if (agency) {
        users.push({
          user_id: agency.agency_id,
          name: agency.name || 'Owner',
          role: 'Owner',
          type: 'agency'
        })
      }
      const { data: agents } = await supabaseAdmin
        .from('agents')
        .select('agent_id, name')
        .eq('agency_id', agencyId)
        .eq('account_status', 'active')
      ;(agents || []).forEach(a => {
        if (a.agent_id) {
          users.push({
            user_id: a.agent_id,
            name: a.name || 'Agent',
            role: 'Agent',
            type: 'agent'
          })
        }
      })
      const { data: teamMembers } = await supabaseAdmin
        .from('organization_team_members')
        .select('user_id, first_name, last_name, email, role:organization_roles(name)')
        .eq('organization_type', 'agency')
        .eq('organization_id', userInfo.organization_id)
        .eq('status', 'active')
      ;(teamMembers || []).forEach(m => {
        if (m.user_id) {
          const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || 'Team Member'
          users.push({
            user_id: m.user_id,
            name,
            role: m.role?.name || 'Team Member',
            type: 'team_member'
          })
        }
      })
    }

    // Deduplicate by user_id (same person can appear as owner + team/agent)
    const seen = new Set()
    const uniqueUsers = users.filter((u) => {
      if (seen.has(u.user_id)) return false
      seen.add(u.user_id)
      return true
    })

    return NextResponse.json({ users: uniqueUsers, success: true })
  } catch (error) {
    console.error('Audit users API error:', error)
    return NextResponse.json({ users: [], error: error.message }, { status: 500 })
  }
}
