import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// POST - Accept invitation and set password
export async function POST(request) {
  try {
    const body = await request.json()
    const { token, password, user_id } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find team member by invitation token
    const { data: teamMember, error: findError } = await supabaseAdmin
      .from('organization_team_members')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single()

    if (findError || !teamMember) {
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 404 })
    }

    // Check if token is expired
    if (teamMember.expires_at && new Date(teamMember.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation token has expired' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update team member
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('organization_team_members')
      .update({
        password_hash: passwordHash,
        user_id: user_id || null, // If user_id provided (from auth.users), use it
        status: 'active',
        accepted_at: new Date().toISOString(),
        invitation_token: null, // Clear token
        expires_at: null // Clear expiration
      })
      .eq('id', teamMember.id)
      .select(`
        *,
        role:organization_roles(id, name, description)
      `)
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to accept invitation', 
        details: updateError.message 
      }, { status: 500 })
    }

    // Remove sensitive data
    const { password_hash, invitation_token, ...sanitized } = updatedMember

    return NextResponse.json({ 
      success: true,
      data: sanitized,
      message: 'Invitation accepted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Validate invitation token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find team member by invitation token
    const { data: teamMember, error } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        id,
        email,
        first_name,
        last_name,
        expires_at,
        status,
        role:organization_roles(id, name)
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !teamMember) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    // Check if expired
    if (teamMember.expires_at && new Date(teamMember.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation token has expired',
        expired: true
      }, { status: 400 })
    }

    // Check if already accepted
    if (teamMember.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation has already been accepted',
        accepted: true
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      data: teamMember
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

