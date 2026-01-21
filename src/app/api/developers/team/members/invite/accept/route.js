import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// POST - Accept invitation and create Supabase Auth account
export async function POST(request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find team member by invitation token
    const { data: teamMember, error: findError } = await supabaseAdmin
      .from('organization_team_members')
      .select(`
        *,
        role:organization_roles(id, name, description)
      `)
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

    // Create Supabase client for auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if user already exists in auth.users
    let userId = null
    try {
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(teamMember.email)
      
      if (!getUserError && existingUser?.user) {
        userId = existingUser.user.id
        console.log('User already exists in auth.users:', userId)
      }
    } catch (err) {
      console.log('User does not exist, will create new account')
    }

    // Create user account in Supabase Auth if doesn't exist
    if (!userId) {
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: teamMember.email,
        password: password,
        options: {
          emailRedirectTo: null, // Skip email verification for team members
          data: {
            user_type: 'team_member',
            organization_type: teamMember.organization_type,
            organization_id: teamMember.organization_id,
            first_name: teamMember.first_name,
            last_name: teamMember.last_name
          }
        }
      })

      if (signUpError || !newUser?.user) {
        console.error('Error creating user:', signUpError)
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.', details: signUpError?.message },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      // Auto-confirm email for team members (they were invited, so no need for email confirmation)
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: {
            user_type: 'team_member',
            organization_type: teamMember.organization_type,
            organization_id: teamMember.organization_id,
            first_name: teamMember.first_name,
            last_name: teamMember.last_name
          }
        })
        console.log('✅ Team member email auto-confirmed successfully')
      } catch (confirmErr) {
        console.error('Error confirming team member email:', confirmErr)
        // Continue anyway - user can still login
      }
    } else {
      // User already exists - update password and ensure email is confirmed and metadata is set
      try {
        // Update password for existing user
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true,
          user_metadata: {
            user_type: 'team_member',
            organization_type: teamMember.organization_type,
            organization_id: teamMember.organization_id,
            first_name: teamMember.first_name,
            last_name: teamMember.last_name
          }
        })
        console.log('✅ Existing user password updated and metadata set')
      } catch (updateErr) {
        console.error('Error updating existing user:', updateErr)
        return NextResponse.json(
          { error: 'Failed to update account. Please try again.', details: updateErr?.message },
          { status: 500 }
        )
      }
    }

    // Update team member record
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('organization_team_members')
      .update({
        user_id: userId, // Set user_id from auth.users
        status: 'active',
        accepted_at: new Date().toISOString(),
        invitation_token: null, // Clear token
        expires_at: null // Clear expiration
        // Note: password_hash is kept for backward compatibility but not used for login
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
      message: 'Invitation accepted successfully. You can now log in with your email and password.'
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

