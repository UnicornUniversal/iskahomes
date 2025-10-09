import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName' },
        { status: 400 }
      )
    }

    // Sign up admin user with Supabase Auth
    const { data: authData, error: authError } = await signUp(email, password, {
      user_type: 'admin',
      full_name: fullName
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_type: 'admin',
        name: fullName
      }
    })

  } catch (error) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
