import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch a specific role
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

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
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Fetch the role
    const { data: role, error } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
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
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Check if role exists and belongs to this developer
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .single()

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent editing system roles (Owner)
    if (existingRole.is_system_role && existingRole.name === 'Owner') {
      return NextResponse.json({ error: 'Cannot modify Owner role' }, { status: 403 })
    }

    // Check permissions
    const { data: teamMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id, permissions')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('user_id', decoded.user_id)
      .eq('status', 'active')
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', teamMember.role_id)
      .single()

    if (userRole?.name !== 'Owner' && userRole?.name !== 'Admin') {
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
        .eq('organization_id', developer.id)
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
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Check if role exists
    const { data: existingRole } = await supabaseAdmin
      .from('organization_roles')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .single()

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent deleting system roles
    if (existingRole.is_system_role) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }

    // Check permissions (only Owner/Admin)
    const { data: teamMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('user_id', decoded.user_id)
      .eq('status', 'active')
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', teamMember.role_id)
      .single()

    if (userRole?.name !== 'Owner' && userRole?.name !== 'Admin') {
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

