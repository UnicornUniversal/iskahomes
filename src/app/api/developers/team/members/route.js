import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest, requirePermission } from '@/lib/apiPermissionMiddleware'
import { sendTeamMemberInvitationEmail } from '@/lib/sendgrid'
import crypto from 'crypto'

// GET - Fetch all team members for a developer organization
export async function GET(request) {
  try {
    // Authenticate and check permission
    const { userInfo, error: authError, status } = await requirePermission(request, 'team.view')
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Get organization ID
    const organizationId = userInfo.organization_id
    const organizationType = userInfo.organization_type || 'developer'

    // Fetch all team members with role info
    const { data: teamMembers, error } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        *,
        role:organization_roles(id, name, description, is_system_role)
      `)
      .eq('organization_type', organizationType)
      .eq('organization_id', organizationId)
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
    // Authenticate and check permission
    const { userInfo, error: authError, status } = await requirePermission(request, 'team.invite')
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Get organization info
    const organizationId = userInfo.organization_id
    const organizationType = userInfo.organization_type || 'developer'

    const body = await request.json()
    const { email, role_id, first_name, last_name, phone, invitation_message } = body

    if (!email || !role_id) {
      return NextResponse.json({ error: 'Email and role_id are required' }, { status: 400 })
    }

    // Verify role exists and belongs to this organization
    const { data: role } = await supabaseAdmin
      .from('organization_roles')
      .select('id, permissions')
      .eq('id', role_id)
      .eq('organization_type', organizationType)
      .eq('organization_id', organizationId)
      .single()

    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email already exists for this organization
    const { data: existingMember } = await supabaseAdmin
      .from('organization_team_members')
      .select('id, status')
      .eq('organization_type', organizationType)
      .eq('organization_id', organizationId)
      .eq('email', email)
      .neq('status', 'inactive')
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ 
        error: 'User with this email is already a team member' 
      }, { status: 400 })
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Get organization name for email
    let organizationName = 'the team'
    if (organizationType === 'developer') {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('name')
        .eq('id', organizationId)
        .single()
      organizationName = developer?.name || 'the team'
    } else if (organizationType === 'agency') {
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('name')
        .eq('id', organizationId)
        .single()
      organizationName = agency?.name || 'the team'
    }

    // Get role name for email
    const roleName = role.name || null
    const teamMemberName = first_name && last_name ? `${first_name} ${last_name}` : first_name || email.split('@')[0]

    // CRITICAL: Send invitation email FIRST before creating database record
    // This ensures we only create team members if the email was successfully sent
    let emailResult
    try {
      emailResult = await sendTeamMemberInvitationEmail(
        email,
        teamMemberName,
        organizationName,
        roleName,
        invitationToken,
        organizationType,
        invitation_message
      )
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error)
        return NextResponse.json(
          { error: 'Failed to send invitation email. Please try again or contact support.' },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // Create team member record after email is sent successfully
    const { data: newMember, error } = await supabaseAdmin
      .from('organization_team_members')
      .insert({
        organization_type: organizationType,
        organization_id: organizationId,
        email,
        role_id,
        permissions: role.permissions, // Copy permissions from role
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        status: 'pending',
        invitation_token: invitationToken,
        invited_by: userInfo.user_id,
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
      data: sanitized,
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

