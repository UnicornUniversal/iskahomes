import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'

// GET - Fetch a specific team member
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

    // Fetch the team member with role info
    const { data: member, error } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        *,
        role:organization_roles(id, name, description, is_system_role)
      `)
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (error || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Remove sensitive data
    const { password_hash, invitation_token, ...sanitized } = member

    return NextResponse.json({ 
      success: true,
      data: sanitized
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update a team member
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

    // Check if team member exists
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Check permissions - use userInfo which already has role_id and permissions
    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', userInfo.role_id)
      .single()

    if (!userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    const permissions = userInfo.permissions || {}
    const canEdit = permissions.team?.edit || userRole.name === 'Super Admin' || userRole.name === 'Admin'

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent editing Super Admin role (unless current user is Super Admin)
    if (existingMember.role_id) {
      const { data: memberRole } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', existingMember.role_id)
        .single()

      if (memberRole?.name === 'Super Admin' && userRole?.name !== 'Super Admin') {
        return NextResponse.json({ error: 'Cannot modify Super Admin team member' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { role_id, permissions: customPermissions, status, first_name, last_name, phone } = body

    // Prevent changing role of Super Admin member
    if (existingMember.role_id && role_id && role_id !== existingMember.role_id) {
      const { data: currentMemberRole } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', existingMember.role_id)
        .single()

      if (currentMemberRole?.name === 'Super Admin') {
        return NextResponse.json({ error: 'Cannot change role of Super Admin team member' }, { status: 403 })
      }
    }

    // Prevent changing status of Super Admin member
    if (status !== undefined && status !== existingMember.status) {
      const { data: currentMemberRole } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', existingMember.role_id)
        .single()

      if (currentMemberRole?.name === 'Super Admin' && status !== 'active') {
        return NextResponse.json({ error: 'Cannot change status of Super Admin team member' }, { status: 403 })
      }
    }

    // Build update object
    const updateData = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (status !== undefined) updateData.status = status

    // Handle role change
    if (role_id && role_id !== existingMember.role_id) {
      // Verify new role exists
      const { data: newRole } = await supabaseAdmin
        .from('organization_roles')
        .select('id, permissions')
        .eq('id', role_id)
        .eq('organization_type', 'developer')
        .eq('organization_id', userInfo.organization_id)
        .single()

      if (!newRole) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      updateData.role_id = role_id
      // Update permissions from new role (unless custom permissions provided)
      if (!customPermissions) {
        updateData.permissions = newRole.permissions
      }
    }

    // Handle custom permissions
    if (customPermissions !== undefined) {
      updateData.permissions = customPermissions
    }

    // Update the team member
    const { data: updatedMember, error } = await supabaseAdmin
      .from('organization_team_members')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        role:organization_roles(id, name, description, is_system_role)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to update team member', 
        details: error.message 
      }, { status: 500 })
    }

    // Remove sensitive data
    const { password_hash, invitation_token, ...sanitized } = updatedMember

    return NextResponse.json({ 
      success: true,
      data: sanitized,
      message: 'Team member updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Remove a team member
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

    // Check if team member exists
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id, user_id')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .single()

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Prevent removing yourself
    if (existingMember.user_id === userInfo.user_id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Check permissions - use userInfo which already has role_id
    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', userInfo.role_id)
      .single()

    // Check if trying to remove Owner
    const { data: memberRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', existingMember.role_id)
      .single()

    if (memberRole?.name === 'Super Admin') {
      return NextResponse.json({ error: 'Cannot remove Super Admin' }, { status: 403 })
    }

    if (userRole?.name !== 'Super Admin' && userRole?.name !== 'Admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Soft delete - set status to 'deleted' instead of actually deleting
    const { error } = await supabaseAdmin
      .from('organization_team_members')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to remove team member', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team member removed successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

