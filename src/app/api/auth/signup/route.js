import { NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js' // Commented out - using SendGrid instead of Supabase auth
import { supabaseAdmin } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/sendgrid' // Using SendGrid for email verification
import crypto from 'crypto'

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
    const validUserTypes = ['developer', 'agent', 'property_seeker', 'agency']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be: developer, agent, property_seeker, or agency' },
        { status: 400 }
      )
    }

    // Generate verification token for email verification (using SendGrid)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // ===== SENDGRID EMAIL LOGIC - Send verification email FIRST before creating any database records =====
    // CRITICAL: Send verification email FIRST before creating any database records
    // This ensures we only create users if the email was successfully sent
    console.log('📧 Attempting to send verification email via SendGrid:', { email, userType })
    let emailResult
    try {
      emailResult = await sendVerificationEmail(email, userData.fullName || 'there', verificationToken)
      
      if (!emailResult.success) {
        console.error('❌ Failed to send verification email:', emailResult.error)
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again or contact support.' },
          { status: 500 }
        )
      }
      console.log('✅ Verification email sent successfully via SendGrid')
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again or contact support.' },
        { status: 500 }
      )
    }
    // ===== END SENDGRID EMAIL LOGIC =====

    // ===== SUPABASE AUTH SIGNUP (COMMENTED OUT - USING SENDGRID INSTEAD) =====
    // // Create a Supabase client for signup (uses anon key, will trigger email sending)
    // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    //
    // if (!supabaseUrl || !supabaseAnonKey) {
    //   return NextResponse.json(
    //     { error: 'Supabase configuration missing' },
    //     { status: 500 }
    //   )
    // }
    //
    // const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    //   auth: {
    //     autoRefreshToken: false,
    //     persistSession: false
    //   }
    // })
    //
    // // CRITICAL: Use Supabase's built-in signUp - this will automatically send verification email
    // // This ensures we only create users if the email was successfully sent
    // console.log('📧 Attempting to sign up user with Supabase:', { email, userType })
    // 
    // const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    //   email: email,
    //   password: password,
    //   options: {
    //     emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_LINK || 'https://iskahomes.vercel.app/'}/verify-email`,
    //     data: {
    //       user_type: userType,
    //       full_name: userData.fullName || '',
    //       phone: userData.phone || ''
    //     }
    //   }
    // })
    //
    // console.log('📧 Supabase signUp response:', { 
    //   hasUser: !!authData?.user, 
    //   hasError: !!authError,
    //   userEmail: authData?.user?.email,
    //   emailConfirmed: authData?.user?.email_confirmed_at,
    //   errorMessage: authError?.message,
    //   session: !!authData?.session,
    //   fullResponse: JSON.stringify(authData, null, 2)
    // })
    //
    // if (authError) {
    //   console.error('❌ Supabase signup error:', authError)
    //   return NextResponse.json(
    //     { error: authError.message || 'Failed to create user account' },
    //     { status: 400 }
    //   )
    // }
    //
    // if (!authData.user) {
    //   console.error('❌ User creation failed - no user data returned')
    //   return NextResponse.json(
    //     { error: 'User creation failed - no user data returned' },
    //     { status: 500 }
    //   )
    // }
    // ===== END SUPABASE AUTH SIGNUP =====

    // ===== CREATE USER WITH SUPABASE ADMIN API (NO EMAIL CONFIRMATION) =====
    // Create user with Supabase Admin API - email confirmation disabled since we're using SendGrid
    console.log('📝 Creating user with Supabase Admin API:', { email, userType })
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // We handle email verification ourselves via SendGrid
      user_metadata: {
        user_type: userType,
        full_name: userData.fullName || '',
        phone: userData.phone || '',
        verification_token: verificationToken
      }
    })

    if (authError) {
      console.error('❌ Supabase admin user creation error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('❌ User creation failed - no user data returned')
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 500 }
      )
    }

    console.log('✅ User created successfully in Supabase Auth (via Admin API):', authData.user.id)
    // ===== END CREATE USER WITH SUPABASE ADMIN API =====

    const newUser = authData.user

    // Create user profile in appropriate table using supabaseAdmin
    console.log('📝 Creating profile for user type:', userType)
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
            // New invitation and signup status fields
            invitation_status: 'sent',
            signup_status: 'invited',
            invitation_token: verificationToken,
            invitation_sent_at: new Date().toISOString(),
            invitation_expires_at: expiresAt.toISOString()
          }
          const { data: devData, error: devError } = await supabaseAdmin
            .from('developers')
            .insert(developerProfile)
            .select()
            .single()
          profileData = devData
          profileError = devError
          if (devError) {
            console.error('❌ Developer profile creation error:', devError)
          } else {
            console.log('✅ Developer profile created successfully')
          }
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
            // New invitation and signup status fields
            invitation_status: 'sent',
            signup_status: 'invited',
            invitation_token: verificationToken,
            invitation_sent_at: new Date().toISOString(),
            invitation_expires_at: expiresAt.toISOString()
          }
          const { data: agentData, error: agentError } = await supabaseAdmin
            .from('agents')
            .insert(agentProfile)
            .select()
            .single()
          profileData = agentData
          profileError = agentError
          if (agentError) {
            console.error('❌ Agent profile creation error:', agentError)
          } else {
            console.log('✅ Agent profile created successfully')
          }
          break

        case 'property_seeker':
          const seekerProfile = {
            user_id: newUser.id,
            name: userData.fullName || '',
            email: email,
            phone: userData.phone || '',
            status: 'active',
            // New invitation and signup status fields
            invitation_status: 'sent',
            signup_status: 'invited',
            invitation_token: verificationToken,
            invitation_sent_at: new Date().toISOString(),
            invitation_expires_at: expiresAt.toISOString()
          }
          const { data: seekerData, error: seekerError } = await supabaseAdmin
            .from('property_seekers')
            .insert(seekerProfile)
            .select()
            .single()
          profileData = seekerData
          profileError = seekerError
          if (seekerError) {
            console.error('❌ Property seeker profile creation error:', seekerError)
          } else {
            console.log('✅ Property seeker profile created successfully')
          }
          break

        case 'agency':
          // Generate slug from agency name (matching signin pattern)
          const agencySlug = (userData.fullName || `agency-${newUser.id.slice(0, 8)}`)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') // Remove special characters
            .replace(/-+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
          
          const agencyProfile = {
            agency_id: newUser.id,
            name: userData.fullName || '',
            email: email,
            phone: userData.phone || '',
            website: userData.companyWebsite || '',
            license_number: userData.registrationNumber || '',
            account_status: 'active',
            slug: agencySlug,
            profile_completion_percentage: 0,
            total_agents: 0,
            active_agents: 0,
            total_listings: 0,
            total_views: 0,
            total_impressions: 0,
            total_leads: 0,
            total_appointments: 0,
            total_sales: 0,
            total_revenue: 0,
            estimated_revenue: 0,
            social_media: [],
            customer_care: [],
            registration_files: [],
            company_locations: [],
            company_statistics: [],
            company_gallery: [],
            commission_rate: { default: 3.0 },
            // Signup status fields
            invitation_status: 'sent',
            signup_status: 'pending', // Will be 'verified' after email confirmation
            invitation_token: verificationToken,
            invitation_sent_at: new Date().toISOString(),
            invitation_expires_at: expiresAt.toISOString()
          }
          const { data: agencyData, error: agencyError } = await supabaseAdmin
            .from('agencies')
            .insert(agencyProfile)
            .select()
            .single()
          profileData = agencyData
          profileError = agencyError
          if (agencyError) {
            console.error('❌ Agency profile creation error:', agencyError)
          } else {
            console.log('✅ Agency profile created successfully')
          }
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

    console.log('✅ Signup completed successfully:', {
      userId: newUser.id,
      email: newUser.email,
      userType,
      profileId: profileData?.id
    })

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification link.',
      user: {
        id: newUser.id,
        email: newUser.email,
        user_type: userType,
        profile: profileData
      }
    })

    console.log('📤 Sending response to client')
    return response

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