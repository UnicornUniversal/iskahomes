import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/sendgrid'

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with this verification token in user_metadata
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      )
    }

    // Find user with matching verification token
    const user = users.find(u => 
      u.user_metadata?.verification_token === token
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can sign in.'
      })
    }

    // Update user email_confirmed_at in Supabase Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          verification_token: null, // Clear the token after verification
          verified_at: new Date().toISOString()
        }
      }
    )

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    // Update the appropriate profile table (property_seekers, developers, agents, or agencies)
    const userType = user.user_metadata?.user_type
    let tableName = ''
    
    switch (userType) {
      case 'property_seeker':
        tableName = 'property_seekers'
        break
      case 'developer':
        tableName = 'developers'
        break
      case 'agent':
        tableName = 'agents'
        break
      case 'agency':
        tableName = 'agencies'
        break
      default:
        tableName = null
    }

    if (tableName) {
      // Build update data based on table type
      const updateData = {
        is_verified: true,
        email_verified_at: new Date().toISOString(),
        is_active: true,
        // Update invitation and signup status
        invitation_status: 'sent', // Email was sent and now verified
        signup_status: 'verified', // User has verified their email
        invitation_token: null // Clear the token after verification
      }
      
      // Use account_status for developers and agencies, status for others
      if (tableName === 'developers' || tableName === 'agencies') {
        updateData.account_status = 'active'
      } else {
        updateData.status = 'active'
      }
      
      // Use developer_id for developers, agency_id for agencies, user_id for others
      let idField = 'user_id'
      if (tableName === 'developers') {
        idField = 'developer_id'
      } else if (tableName === 'agencies') {
        idField = 'agency_id'
      }
      
      const { error: profileUpdateError } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq(idField, user.id)

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
        // Don't fail the verification if profile update fails
      }
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(
        user.email,
        user.user_metadata?.full_name || 'there',
        userType
      )
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.'
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
