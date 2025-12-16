import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Create a Supabase client for signup (uses anon key, will trigger email sending)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Use Supabase's built-in signUp - this will automatically send verification email
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_LINK || 'http://localhost:3000'}/verify-email`,
        data: {
          user_type: userType,
          full_name: userData.fullName || '',
          phone: userData.phone || ''
        }
      }
    })

    if (authError) {
      console.error('Supabase signup error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 500 }
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
            registration_files: [],
            // Signup status fields
            invitation_status: 'sent',
            signup_status: 'pending', // Will be 'verified' after email confirmation
            invitation_sent_at: new Date().toISOString()
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
            status: 'active',
            // Signup status fields
            invitation_status: 'sent',
            signup_status: 'pending', // Will be 'verified' after email confirmation
            invitation_sent_at: new Date().toISOString()
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
            status: 'active',
            // Signup status fields
            invitation_status: 'sent',
            signup_status: 'pending', // Will be 'verified' after email confirmation
            invitation_sent_at: new Date().toISOString()
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
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        )
      }
    } catch (profileCreationError) {
      console.error('Profile creation exception:', profileCreationError)
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileCreationError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email for the verification link.',
      user: {
        id: newUser.id,
        email: newUser.email,
        user_type: userType,
        email_confirmed: newUser.email_confirmed_at ? true : false,
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

