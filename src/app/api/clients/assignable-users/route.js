import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const orgId = userInfo.organization_id

    const { data: members, error } = await supabaseAdmin
      .from('organization_team_members')
      .select('user_id, first_name, last_name, status, role_id')
      .eq('organization_type', 'developer')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .not('user_id', 'is', null)

    if (error) {
      console.error('Assignable users fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const roleIds = [...new Set((members || []).map(m => m.role_id).filter(Boolean))]
    let roleMap = {}
    if (roleIds.length > 0) {
      const { data: roles } = await supabaseAdmin
        .from('organization_roles')
        .select('id, name')
        .in('id', roleIds)
      roleMap = (roles || []).reduce((m, r) => { m[r.id] = r.name; return m }, {})
    }

    const users = (members || [])
      .filter(m => {
        const roleName = roleMap[m.role_id] || ''
        return !/super\s*admin/i.test(roleName)
      })
      .map(m => ({
        id: m.user_id,
        name: [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || 'Unknown',
        role: roleMap[m.role_id] || 'Team member'
      }))

    return NextResponse.json({ success: true, data: users })
  } catch (err) {
    console.error('Assignable users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
