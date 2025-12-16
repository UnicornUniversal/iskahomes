import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import crypto from 'crypto'

// GET - Fetch all team members for a developer organization
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

    // Get developer info
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('developer_id', decoded.user_id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Fetch all team members with role info
    const { data: teamMembers, error } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        *,
        role:organization_roles(id, name, description, is_system_role)
      `)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch team members', 
        details: error.message 
      }, { status: 500 })
    }

    // Remove sensitive data (password_hash, invitation_token)
    const sanitizedMembers = (teamMembers || []).map(member => {
      const { password_hash, invitation_token, ...sanitized } = member
      return sanitized
    })

    return NextResponse.json({ 
      success: true,
      data: sanitizedMembers
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Invite a new team member
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

    // Check permissions - only Owner/Admin can invite
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

    const permissions = teamMember.permissions || {}
    const canInvite = permissions.team?.invite || userRole?.name === 'Owner' || userRole?.name === 'Admin'

    if (!canInvite) {
      return NextResponse.json({ error: 'Insufficient permissions to invite team members' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role_id, first_name, last_name, phone, invitation_message } = body

    if (!email || !role_id) {
      return NextResponse.json({ error: 'Email and role_id are required' }, { status: 400 })
    }

    // Verify role exists and belongs to this developer
    const { data: role } = await supabaseAdmin
      .from('organization_roles')
      .select('id, permissions')
      .eq('id', role_id)
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .single()

    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email already exists for this organization
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('id, status')
      .eq('organization_type', 'developer')
      .eq('organization_id', developer.id)
      .eq('email', email)
      .neq('status', 'inactive')
      .single()

    if (existingMember) {
      return NextResponse.json({ 
        error: 'User with this email is already a team member' 
      }, { status: 400 })
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create team member record
    const { data: newMember, error } = await supabaseAdmin
      .from('organization_team_members')
      .insert({
        organization_type: 'developer',
        organization_id: developer.id,
        email,
        role_id,
        permissions: role.permissions, // Copy permissions from role
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        status: 'pending',
        invitation_token: invitationToken,
        invited_by: decoded.user_id,
        expires_at: expiresAt.toISOString(),
        invitation_message: invitation_message || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to create invitation', 
        details: error.message 
      }, { status: 500 })
    }

    // Remove sensitive data from response
    const { password_hash, invitation_token, ...sanitized } = newMember

    return NextResponse.json({ 
      success: true,
      data: {
        ...sanitized,
        invitation_token // Include token in response so frontend can send email
      },
      message: 'Invitation created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

