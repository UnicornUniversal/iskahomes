import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = {
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumbers: /\d/.test(newPassword)
    }

    const isValidPassword = Object.values(passwordValidation).every(Boolean)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers' },
        { status: 400 }
      )
    }

    // Get email from token or fetch from property seeker profile
    let userEmail = decoded.email
    
    // If email not in token, fetch from property seeker profile
    if (!userEmail && decoded.user_type === 'property_seeker') {
      const { data: seeker } = await supabaseAdmin
        .from('property_seekers')
        .select('email')
        .eq('id', decoded.id)
        .single()
      
      if (seeker) {
        userEmail = seeker.email
      }
    }
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unable to determine user email' },
        { status: 400 }
      )
    }
    
    // Sign in with current password to verify it
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    })

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Update the user's password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update password' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

