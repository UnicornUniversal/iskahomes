import { NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { developerDB, agentDB, homeSeekerDB } from '@/lib/database'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/jwt'

export async function POST(request) {
  console.log('🔐 SIGNIN API: Request received');
  try {
    const body = await request.json()
    const { email, password, user_type: providedUserType } = body

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
    // Priority: 1) Provided user_type (from dropdown), 2) Metadata, 3) Try to detect from profile tables
    let profile = null
    let userType = providedUserType || user.raw_user_meta_data?.user_type || user.user_metadata?.user_type
    console.log('User type priority check:', { providedUserType, metadataType: user.raw_user_meta_data?.user_type || user.user_metadata?.user_type, finalUserType: userType })
    
    // If user_type not provided and not in metadata, try to detect from profile tables
    if (!userType) {
      console.log('🔐 SIGNIN API: User type not in metadata, attempting to detect from profile tables...')
      // Try developers first
      const { data: devCheck } = await developerDB.getByUserId(user.id)
      if (devCheck) {
        userType = 'developer'
        profile = devCheck
        console.log('🔐 SIGNIN API: Detected as developer from profile table')
      } else {
        // Try agencies
        const { data: agencyCheck } = await supabaseAdmin
          .from('agencies')
          .select('*')
          .eq('agency_id', user.id)
          .single()
        if (agencyCheck) {
          userType = 'agency'
          profile = agencyCheck
          console.log('🔐 SIGNIN API: Detected as agency from profile table')
        } else {
          // Try agents
          const { data: agentCheck } = await agentDB.getByUserId(user.id)
          if (agentCheck) {
            userType = 'agent'
            profile = agentCheck
            console.log('🔐 SIGNIN API: Detected as agent from profile table')
          } else {
            // Try property seekers
            const { data: seekerCheck } = await supabase
              .from('property_seekers')
              .select('*')
              .eq('user_id', user.id)
              .single()
            if (seekerCheck) {
              userType = 'property_seeker'
              profile = seekerCheck
              console.log('🔐 SIGNIN API: Detected as property_seeker from profile table')
            }
          }
        }
      }
    }
    
    console.log('User type after detection:', userType)

    if (userType) {
      // Validate that provided user_type matches an existing profile
      if (providedUserType && profile && userType !== providedUserType) {
        console.log('🔐 SIGNIN API: User type mismatch!', { provided: providedUserType, detected: userType })
        // Use the provided type and try to fetch that profile instead
        userType = providedUserType
        profile = null // Reset to fetch correct profile
      }
      
      switch (userType) {
        case 'developer':
          console.log('🔐 SIGNIN API: Looking for developer profile for user:', user.id)
          // If profile already found during detection and matches, use it
          if (profile && userType === 'developer') {
            console.log('🔐 SIGNIN API: Using pre-detected developer profile')
          } else {
            const { data: devProfile, error: devError } = await developerDB.getByUserId(user.id)
            console.log('🔐 SIGNIN API: Developer profile result:', { 
              devProfile: devProfile ? 'found' : 'not found',
              devError: devError ? devError.message : 'none'
            })
            
            // If provided user_type is developer but profile doesn't exist, return error
            if (providedUserType === 'developer' && (devError || !devProfile)) {
              return NextResponse.json(
                { error: 'No developer profile found for this email. Please check your account type selection.' },
                { status: 404 }
              )
            }
            
            // If developer profile doesn't exist, create it (only if not explicitly provided)
            if (devError || !devProfile) {
              if (providedUserType === 'developer') {
                return NextResponse.json(
                  { error: 'Developer account not found. Please check your account type or contact support.' },
                  { status: 404 }
                )
              }
              console.log('🔐 SIGNIN API: Developer profile not found, creating new one...')
              const newDeveloperProfile = {
                developer_id: user.id,
                name: user.raw_user_meta_data?.full_name || 'Developer',
                email: user.email,
                phone: user.raw_user_meta_data?.phone || '',
                website: user.raw_user_meta_data?.companyWebsite || '',
                license_number: user.raw_user_meta_data?.registrationNumber || '',
                account_status: 'active',
                slug: user.raw_user_meta_data?.full_name?.toLowerCase().replace(/\s+/g, '-') || `developer-${user.id.slice(0, 8)}`,
                profile_completion_percentage: 0,
                total_units: 0,
                total_developments: 0,
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
          }
          break
        case 'agency':
          if (profile && userType === 'agency') {
            console.log('🔐 SIGNIN API: Using pre-detected agency profile')
          } else {
            console.log('🔐 SIGNIN API: Looking for agency profile for user:', user.id)
            const { data: agencyProfile, error: agencyError } = await supabaseAdmin
              .from('agencies')
              .select('*')
              .eq('agency_id', user.id)
              .single()
            
            console.log('🔐 SIGNIN API: Agency profile result:', { 
              agencyProfile: agencyProfile ? 'found' : 'not found',
              agencyError: agencyError ? agencyError.message : 'none'
            })
            
            if (providedUserType === 'agency' && (agencyError || !agencyProfile)) {
              return NextResponse.json(
                { error: 'No agency profile found for this email. Please check your account type selection.' },
                { status: 404 }
              )
            }
            profile = agencyProfile
          }
          break
        case 'agent':
          if (profile && userType === 'agent') {
            console.log('🔐 SIGNIN API: Using pre-detected agent profile')
          } else {
            const { data: agentProfile, error: agentError } = await agentDB.getByUserId(user.id)
            if (providedUserType === 'agent' && (agentError || !agentProfile)) {
              return NextResponse.json(
                { error: 'No agent profile found for this email. Please check your account type selection.' },
                { status: 404 }
              )
            }
            profile = agentProfile
          }
          break
        case 'seeker':
          const { data: seekerProfile } = await homeSeekerDB.getByUserId(user.id)
          profile = seekerProfile
          break
        case 'property_seeker':
          if (profile && userType === 'property_seeker') {
            console.log('🔐 SIGNIN API: Using pre-detected property seeker profile')
          } else {
            console.log('🔐 SIGNIN API: Looking for property seeker profile for user:', user.id)
            const { data: propertySeekerProfile, error: seekerError } = await supabase
              .from('property_seekers')
              .select('*')
              .eq('user_id', user.id)
              .single()
            
            console.log('🔐 SIGNIN API: Property seeker profile result:', { 
              propertySeekerProfile: propertySeekerProfile ? 'found' : 'not found',
              seekerError: seekerError ? seekerError.message : 'none'
            })
            
            if (providedUserType === 'property_seeker' && (seekerError || !propertySeekerProfile)) {
              return NextResponse.json(
                { error: 'No property seeker profile found for this email. Please check your account type selection.' },
                { status: 404 }
              )
            }
            
            profile = propertySeekerProfile
          }
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

    // Generate JWT token for developers, agencies, agents, and property seekers
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
      } catch (jwtError) {
        console.error('Error generating JWT token:', jwtError);
      }
    } else if (userType === 'agency' && profile) {
      try {
        jwtToken = generateToken({
          id: user.id,
          user_id: user.id,
          agency_id: profile.agency_id,
          email: user.email,
          user_type: userType
        });
        console.log('JWT token generated successfully for agency:', jwtToken ? 'Yes' : 'No');
      } catch (jwtError) {
        console.error('Error generating JWT token for agency:', jwtError);
      }
    } else if (userType === 'agent' && profile) {
      try {
        jwtToken = generateToken({
          id: user.id,
          user_id: user.id,
          agent_id: profile.agent_id,
          email: user.email,
          user_type: userType
        });
        console.log('JWT token generated successfully for agent:', jwtToken ? 'Yes' : 'No');
      } catch (jwtError) {
        console.error('Error generating JWT token for agent:', jwtError);
      }
    } else if (userType === 'property_seeker' && profile) {
      try {
        jwtToken = generateToken({
          id: profile.id,
          user_id: user.id,
          email: user.email,
          user_type: userType
        });
        console.log('JWT token generated successfully for property seeker:', jwtToken ? 'Yes' : 'No');
      } catch (jwtError) {
        console.error('Error generating JWT token for property seeker:', jwtError);
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

    // Build profile response based on user type
    let profileData = null;
    if (profile) {
      if (userType === 'developer') {
        profileData = {
          id: profile.id,
          developer_id: profile.developer_id,
          name: profile.name,
          slug: profile.slug,
          account_status: profile.account_status
        };
      } else if (userType === 'agency') {
        profileData = {
          id: profile.id,
          agency_id: profile.agency_id,
          name: profile.name,
          slug: profile.slug,
          account_status: profile.account_status
        };
      } else if (userType === 'agent') {
        profileData = {
          id: profile.id,
          agent_id: profile.agent_id,
          name: profile.name,
          slug: profile.slug,
          account_status: profile.account_status,
          agency_id: profile.agency_id
        };
      } else if (userType === 'property_seeker') {
        profileData = {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          slug: profile.slug,
          status: profile.status
        };
      } else {
        profileData = {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          account_status: profile.account_status
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: userType === 'property_seeker' ? profile?.id : user.id,
        email: user.email,
        user_type: userType,
        profile: profileData
      },
      token: jwtToken,
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
