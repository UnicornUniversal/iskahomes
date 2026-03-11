import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { captureAuditEvent } from '@/lib/auditLogger'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send password reset email using Supabase Auth
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://iskahomes.vercel.app/'}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    captureAuditEvent('auth_password_reset_requested', {
      user_id: 'anonymous',
      user_type: 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/auth/forgot-password',
      metadata: { email_requested: true },
    }, 'anonymous')

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      data
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
