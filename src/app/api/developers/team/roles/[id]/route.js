import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'

// GET - Fetch a specific role
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Fetch the role
    const { data: role, error } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (error || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      data: role
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update a role
export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Check if role exists and belongs to this developer
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent editing system roles (Super Admin)
    if (existingRole.is_system_role && existingRole.name === 'Super Admin') {
      return NextResponse.json({ error: 'Cannot modify Super Admin role' }, { status: 403 })
    }

    // Check permissions - use userInfo which already has role_id
    const { data: currentUserRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', userInfo.role_id)
      .single()

    if (!currentUserRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    if (currentUserRole?.name !== 'Super Admin' && currentUserRole?.name !== 'Admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions, is_default } = body

    // Build update object
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_default !== undefined) updateData.is_default = is_default

    // Check name uniqueness if changing name
    if (name && name !== existingRole.name) {
      const { data: nameExists } = await supabaseAdmin
        .from('organization_roles')
        .select('id')
        .eq('organization_type', 'developer')
        .eq('organization_id', userInfo.organization_id)
        .eq('name', name)
        .single()

      if (nameExists) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
      }
    }

    // Update the role
    const { data: updatedRole, error } = await supabaseAdmin
      .from('organization_roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to update role', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Delete a role
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Check if role exists
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent deleting system roles, especially Super Admin
    if (existingRole.is_system_role && existingRole.name === 'Super Admin') {
      return NextResponse.json({ error: 'Cannot delete Super Admin role' }, { status: 403 })
    }
    if (existingRole.is_system_role) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }

    // Check permissions (only Super Admin/Admin) - use userInfo which already has role_id
    const { data: currentUserRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', userInfo.role_id)
      .single()

    if (currentUserRole?.name !== 'Super Admin' && currentUserRole?.name !== 'Admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if role is assigned to any team members
    const { data: assignedMembers } = await supabaseAdmin
      .from('organization_team_members')
      .select('id')
      .eq('role_id', id)
      .limit(1)

    if (assignedMembers && assignedMembers.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role that is assigned to team members. Please reassign members first.' 
      }, { status: 400 })
    }

    // Delete the role
    const { error } = await supabaseAdmin
      .from('organization_roles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete role', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Role deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

