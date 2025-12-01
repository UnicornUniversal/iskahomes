import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/sendgrid'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, userType, ...userData } = body

    // Validate required fields
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, userType' },
        { status: 400 }
      )
    }

    // Validate user type
    const validUserTypes = ['developer', 'agent', 'property_seeker']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be: developer, agent, or property_seeker' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex')

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // We'll handle email verification ourselves
      user_metadata: {
        user_type: userType,
        full_name: userData.fullName || '',
        phone: userData.phone || '',
        verification_token: verificationToken
      }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    const newUser = authData.user

    // Create user profile in appropriate table using supabaseAdmin
    let profileData = null
    let profileError = null

    try {
      switch (userType) {
        case 'developer':
          // Generate slug from company name (matching signin pattern)
          const slug = (userData.fullName || `developer-${newUser.id.slice(0, 8)}`)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') // Remove special characters
            .replace(/-+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
          
          const developerProfile = {
            developer_id: newUser.id,
            name: userData.fullName || '',
            email: email,
            phone: userData.phone || '',
            website: userData.companyWebsite || '',
            license_number: userData.registrationNumber || '',
            account_status: 'active',
            slug: slug,
            profile_completion_percentage: 0,
            total_units: 0,
            total_developments: 0,
            social_media: [],
            customer_care: [],
            registration_files: []
          }
          const { data: devData, error: devError } = await supabaseAdmin
            .from('developers')
            .insert(developerProfile)
            .select()
            .single()
          profileData = devData
          profileError = devError
          break

        case 'agent':
          const agentProfile = {
            user_id: newUser.id,
            name: userData.fullName || '',
            email: email,
            phone: userData.phone || '',
            agency_name: userData.agencyName || '',
            license_id: userData.licenseId || '',
            status: 'active'
          }
          const { data: agentData, error: agentError } = await supabaseAdmin
            .from('agents')
            .insert(agentProfile)
            .select()
            .single()
          profileData = agentData
          profileError = agentError
          break

        case 'property_seeker':
          const seekerProfile = {
            user_id: newUser.id,
            name: userData.fullName || '',
            email: email,
            phone: userData.phone || '',
            status: 'active'
          }
          const { data: seekerData, error: seekerError } = await supabaseAdmin
            .from('property_seekers')
            .insert(seekerProfile)
            .select()
            .single()
          profileData = seekerData
          profileError = seekerError
          break
      }

      if (profileError) {
        console.error('Profile creation failed:', profileError)
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.id)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    } catch (profileCreationError) {
      console.error('Profile creation exception:', profileCreationError)
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Send verification email using SendGrid
    try {
      await sendVerificationEmail(email, userData.fullName || 'there', verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the signup if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification link.',
      user: {
        id: newUser.id,
        email: newUser.email,
        user_type: userType,
        profile: profileData
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}