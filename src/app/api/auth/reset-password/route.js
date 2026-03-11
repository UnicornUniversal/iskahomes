import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { captureAuditEvent } from '@/lib/auditLogger'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password, accessToken, refreshToken } = body

    // Validate required fields
    if (!password || !accessToken) {
      return NextResponse.json(
        { error: 'Password and access token are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const isValidPassword = Object.values(passwordValidation).every(Boolean)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password does not meet security requirements' },
        { status: 400 }
      )
    }

    // Set the session using the tokens from the reset link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Update the user's password
    const { data, error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    captureAuditEvent('auth_password_reset', {
      user_id: data?.user?.id ?? 'unknown',
      user_type: 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/auth/reset-password',
    }, data?.user?.id)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      data
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
