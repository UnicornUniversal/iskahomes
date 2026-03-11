import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest, requirePermission } from '@/lib/apiPermissionMiddleware'

// GET - Fetch all roles for an organization (developer or agency)
export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await requirePermission(request, 'team.view')
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const organizationType = userInfo.organization_type || 'developer'

    // Fetch all roles for this organization
    const { data: roles, error } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('organization_type', organizationType)
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
    const { userInfo, error: authError, status } = await requirePermission(request, 'team.manage_roles')
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const organizationType = userInfo.organization_type || 'developer'

    const body = await request.json()
    const { name, description, permissions: rolePermissions, is_default } = body

    if (!name || !rolePermissions) {
      return NextResponse.json({ error: 'Name and permissions are required' }, { status: 400 })
    }

    // Check if role name already exists
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('id')
      .eq('organization_type', organizationType)
      .eq('organization_id', userInfo.organization_id)
      .eq('name', name)
      .maybeSingle()

    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    // Create the role
    const { data: newRole, error } = await supabaseAdmin
      .from('organization_roles')
      .insert({
        organization_type: organizationType,
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

