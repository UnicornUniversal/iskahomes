import { NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { developerDB, agentDB, homeSeekerDB } from '@/lib/database'
import { generateToken } from '@/lib/jwt'

export async function POST(request) {
  console.log('🔐 SIGNIN API: Request received');
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔐 SIGNIN API: Request body:', {
      email: email,
      password: password ? '***provided***' : 'missing'
    });

    // Validate required fields
    if (!email || !password) {
      console.log('🔐 SIGNIN API: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🔐 SIGNIN API: Calling signIn with Supabase Auth...');
    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await signIn(email, password)

    if (authError) {
      console.log('🔐 SIGNIN API: Supabase Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    console.log('🔐 SIGNIN API: Supabase Auth successful');
    const user = authData.user
    const session = authData.session

    console.log('🔐 SIGNIN API: User data from Supabase:', {
      userId: user.id,
      email: user.email,
      userType: user.user_metadata?.user_type || 'not set'
    });


    console.log('User object:', JSON.stringify(user, null, 2))
    console.log('User raw_user_meta_data:', user.raw_user_meta_data)
    console.log('User user_metadata:', user.user_metadata)
    
    // Get user profile based on user type
    let profile = null
    const userType = user.raw_user_meta_data?.user_type || user.user_metadata?.user_type
    console.log('User type from metadata:', userType)

    if (userType) {
      switch (userType) {
        case 'developer':
          console.log('🔐 SIGNIN API: Looking for developer profile for user:', user.id)
          const { data: devProfile, error: devError } = await developerDB.getByUserId(user.id)
          console.log('🔐 SIGNIN API: Developer profile result:', { 
            devProfile: devProfile ? 'found' : 'not found',
            devError: devError ? devError.message : 'none'
          })
          
          // If developer profile doesn't exist, create it
          if (devError || !devProfile) {
            console.log('🔐 SIGNIN API: Developer profile not found, creating new one...')
            const newDeveloperProfile = {
              developer_id: user.id,
              name: user.raw_user_meta_data?.full_name || 'Developer',
              email: user.email,
              phone: user.raw_user_meta_data?.phone || '',
              website: user.raw_user_meta_data?.companyWebsite || '',
              license: user.raw_user_meta_data?.registrationNumber || '',
              account_status: 'active',
              slug: user.raw_user_meta_data?.full_name?.toLowerCase().replace(/\s+/g, '-') || `developer-${user.id.slice(0, 8)}`,
              profile_completion_percentage: 0,
              total_properties: 0,
              social_media: [],
              customer_care: [],
              registration_files: []
            }
            
            console.log('Creating developer profile with data:', newDeveloperProfile)
            const { data: createdProfile, error: createError } = await developerDB.create(newDeveloperProfile)
            console.log('Create profile result:', { createdProfile, createError })
            
            if (createError) {
              console.error('Error creating developer profile:', createError)
              profile = null
            } else {
              profile = createdProfile
            }
          } else {
            console.log('Using existing developer profile')
            profile = devProfile
          }
          break
        case 'agent':
          const { data: agentProfile } = await agentDB.getByUserId(user.id)
          profile = agentProfile
          break
        case 'seeker':
          const { data: seekerProfile } = await homeSeekerDB.getByUserId(user.id)
          profile = seekerProfile
          break
        case 'admin':
          // Admin profile (you can customize this)
          profile = {
            id: user.id,
            name: user.raw_user_meta_data?.full_name || 'Admin',
            email: user.email,
            slug: 'admin'
          }
          break
      }
    }

    // Generate JWT token for developers
    let jwtToken = null;
    if (userType === 'developer' && profile) {
      try {
        jwtToken = generateToken({
          id: user.id,
          user_id: user.id,
          developer_id: profile.developer_id,
          email: user.email,
          user_type: userType
        });
        console.log('JWT token generated successfully:', jwtToken ? 'Yes' : 'No');
        console.log('JWT token content:', {
          id: user.id,
          user_id: user.id,
          developer_id: profile.developer_id,
          email: user.email,
          user_type: userType
        });
        console.log('Generated JWT token (first 50 chars):', jwtToken ? jwtToken.substring(0, 50) + '...' : 'null');
      } catch (jwtError) {
        console.error('Error generating JWT token:', jwtError);
      }
    } else {
      console.log('JWT not generated - userType:', userType, 'profile exists:', !!profile);
    }

    console.log('🔐 SIGNIN API: Final response data:', {
      userType,
      profile: profile ? {
        id: profile.id,
        developer_id: profile.developer_id,
        name: profile.name,
        slug: profile.slug
      } : 'null',
      jwtToken: jwtToken ? 'generated' : 'null',
      user: {
        id: user.id,
        email: user.email
      }
    });

    console.log('🔐 SIGNIN API: Sending response to client...');

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        user_type: userType,
        profile: profile ? {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          account_status: profile.account_status
        } : null
      },
      token: jwtToken, // JWT token for developers
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
