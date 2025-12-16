import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch a specific team member
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

    // Fetch the team member with role info
    const { data: member, error } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        *,
        role:organization_roles(id, name, description, is_system_role)
      `)
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
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

    // Check if team member exists
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('*')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .single()

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Check permissions
    const { data: currentUser } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id, permissions')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('user_id', decoded.user_id)
      .eq('status', 'active')
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', currentUser.role_id)
      .single()

    const permissions = currentUser.permissions || {}
    const canEdit = permissions.team?.edit || userRole?.name === 'Owner' || userRole?.name === 'Admin'

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent editing Owner role (unless current user is Owner)
    if (existingMember.role_id) {
      const { data: memberRole } = await supabaseAdmin
        .from('organization_roles')
        .select('name')
        .eq('id', existingMember.role_id)
        .single()

      if (memberRole?.name === 'Owner' && userRole?.name !== 'Owner') {
        return NextResponse.json({ error: 'Cannot modify Owner team member' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { role_id, permissions: customPermissions, status, first_name, last_name, phone } = body

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
        .eq('organization_id', developer.id)
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

    // Check if team member exists
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id, user_id')
      .eq('id', id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .single()

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Prevent removing yourself
    if (existingMember.user_id === decoded.user_id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Check permissions
    const { data: currentUser } = await supabaseAdmin
      .from('organization_team_members')
      .select('role_id')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('user_id', decoded.user_id)
      .eq('status', 'active')
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 403 })
    }

    const { data: userRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', currentUser.role_id)
      .single()

    // Check if trying to remove Owner
    const { data: memberRole } = await supabaseAdmin
      .from('organization_roles')
      .select('name')
      .eq('id', existingMember.role_id)
      .single()

    if (memberRole?.name === 'Owner') {
      return NextResponse.json({ error: 'Cannot remove Owner' }, { status: 403 })
    }

    if (userRole?.name !== 'Owner' && userRole?.name !== 'Admin') {
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

