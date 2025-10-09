import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
    const validUserTypes = ['developer', 'agent', 'seeker']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be: developer, agent, or seeker' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex')
    const activationSecret = process.env.ACTIVATION_SECRET
    const verificationHash = require('crypto')
      .createHash('sha256')
      .update(verificationToken + activationSecret)
      .digest('hex')

    // Create user in database (without Supabase auth)
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: require('bcryptjs').hashSync(password, 10),
        user_type: userType,
        full_name: userData.fullName || '',
        phone: userData.phone || '',
        verification_token: verificationHash,
        is_verified: false,
        account_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('User creation failed:', userError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile in appropriate table
    let profileData = null
    let profileError = null

    switch (userType) {
      case 'developer':
        const developerProfile = {
          user_id: newUser.id,
          name: userData.fullName || '',
          email: email,
          phone: userData.phone || '',
          website: userData.companyWebsite || '',
          license: userData.registrationNumber || '',
          account_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const { data: devData, error: devError } = await supabase
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
          account_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .insert(agentProfile)
          .select()
          .single()
        profileData = agentData
        profileError = agentError
        break

      case 'seeker':
        const seekerProfile = {
          user_id: newUser.id,
          name: userData.fullName || '',
          email: email,
          phone: userData.phone || '',
          account_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const { data: seekerData, error: seekerError } = await supabase
          .from('home_seekers')
          .insert(seekerProfile)
          .select()
          .single()
        profileData = seekerData
        profileError = seekerError
        break
    }

    if (profileError) {
      // If profile creation fails, clean up the user
      await supabase.from('users').delete().eq('id', newUser.id)
      console.error('Profile creation failed:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Send verification email using SendGrid
    const frontendLink = process.env.FRONTEND_LINK
    const verificationUrl = `${frontendLink}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject: 'Verify Your Account - Iska Homes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Welcome to Iska Homes!</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Account</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Hi ${userData.fullName || 'there'},<br><br>
              Thank you for signing up as a <strong>${userType.charAt(0).toUpperCase() + userType.slice(1)}</strong> on Iska Homes!
              To complete your registration and start using our platform, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verify My Account
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              If the button doesn't work, you can also copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 14px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Iska Homes, please ignore this email.</p>
          </div>
        </div>
      `
    }

    try {
      await sgMail.send(msg)
      console.log('Verification email sent successfully to:', email)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the signup if email fails, but log it
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}