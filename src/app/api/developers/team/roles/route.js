import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch all roles for a developer organization
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get developer info to get organization_id
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Fetch all roles for this developer
    const { data: roles, error } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
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
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get developer info
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Check permissions - only Owner/Admin can create roles
    const { data: teamMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('permissions')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('user_id', decoded.user_id)
      .eq('status', 'active')
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const permissions = teamMember.permissions || {}
    if (!permissions.team?.invite && !permissions.team?.edit) {
      // Check if user has Owner/Admin role
      const { data: role } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', teamMember.role_id)
        .single()

      if (role?.name !== 'Owner' && role?.name !== 'Admin') {
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
        organization_id: developer.id,
        name,
        description: description || null,
        permissions: rolePermissions,
        is_system_role: false,
        is_default: is_default || false,
        created_by: decoded.user_id
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

