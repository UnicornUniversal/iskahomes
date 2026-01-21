import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'

// GET - Fetch all roles for a developer organization
export async function GET(request) {
  try {
    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Fetch all roles for this developer organization
    const { data: roles, error } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch roles', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: roles || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Create a new role
export async function POST(request) {
  try {
    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Check permissions - only Super Admin/Admin can create roles
    const { data: teamMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('permissions, role_id')
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .eq('user_id', userInfo.user_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const permissions = teamMember.permissions || {}
    if (!permissions.team?.invite && !permissions.team?.edit) {
      // Check if user has Super Admin/Admin role
      const { data: role } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', teamMember.role_id)
        .single()

      if (role?.name !== 'Super Admin' && role?.name !== 'Admin') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { name, description, permissions: rolePermissions, is_default } = body

    if (!name || !rolePermissions) {
      return NextResponse.json({ error: 'Name and permissions are required' }, { status: 400 })
    }

    // Check if role name already exists
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('id')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('name', name)
      .single()

    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    // Create the role
    const { data: newRole, error } = await supabaseAdmin
      .from('organization_roles')
      .insert({
        organization_type: 'developer',
        organization_id: userInfo.organization_id,
        name,
        description: description || null,
        permissions: rolePermissions,
        is_system_role: false,
        is_default: is_default || false,
        created_by: userInfo.user_id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to create role', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: newRole,
      message: 'Role created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

