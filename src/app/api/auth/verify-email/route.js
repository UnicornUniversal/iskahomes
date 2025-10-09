import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const body = await request.json()
    const { token, email } = body

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      )
    }

    // Verify the token
    const activationSecret = process.env.ACTIVATION_SECRET
    const verificationHash = crypto
      .createHash('sha256')
      .update(token + activationSecret)
      .digest('hex')

    // Find user with matching email and verification token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, verification_token, is_verified, account_status')
      .eq('email', email)
      .eq('verification_token', verificationHash)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid verification token or email' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Update user to verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        account_status: 'active',
        verification_token: null, // Clear the token
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user verification status:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    // Update profile status in the appropriate table
    const userType = user.user_type || 'seeker' // Default to seeker if not set
    let profileUpdateError = null

    switch (userType) {
      case 'developer':
        const { error: devError } = await supabase
          .from('developers')
          .update({
            account_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        profileUpdateError = devError
        break

      case 'agent':
        const { error: agentError } = await supabase
          .from('agents')
          .update({
            account_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        profileUpdateError = agentError
        break

      case 'seeker':
        const { error: seekerError } = await supabase
          .from('home_seekers')
          .update({
            account_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        profileUpdateError = seekerError
        break
    }

    if (profileUpdateError) {
      console.error('Failed to update profile status:', profileUpdateError)
      // Don't fail the verification if profile update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        user_type: userType
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
