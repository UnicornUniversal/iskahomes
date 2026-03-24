import { NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { developerDB, agentDB, homeSeekerDB } from '@/lib/database'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/jwt'
import { captureAuditEvent } from '@/lib/auditLogger'
import crypto from 'crypto'
import { setKey, getKey, deleteKey } from '@/lib/redis'

const OTP_TTL_SECONDS = 180
const OTP_MAX_ATTEMPTS = 5

function parseSettings(settings) {
  if (!settings) return {}
  if (typeof settings === 'object') return settings
  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings)
    } catch {
      return {}
    }
  }
  return {}
}

function isTwoFactorSmsEnabled(settings) {
  const normalized = parseSettings(settings)
  return normalized?.two_factor?.sms === true
}

function maskPhone(phone = '') {
  const text = String(phone)
  if (text.length <= 4) return text
  return `${'*'.repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex')
}

function normalizePhoneForMnotify(phone = '') {
  return String(phone).replace(/\D/g, '')
}

async function sendOtpViaMnotify(phone, otpCode) {
  const apiKey = process.env.MNOTIFY_API_KEY
  if (!apiKey) {
    return { success: false, error: 'MNOTIFY_API_KEY must be set' }
  }

  const normalizedRecipient = normalizePhoneForMnotify(phone)
  if (!normalizedRecipient) {
    return { success: false, error: 'Recipient phone number is invalid' }
  }

  const senderId = process.env.MNOTIFY_SENDER_ID || 'IskaHomes'
  const message = `Your Iska Homes sign-in OTP is ${otpCode}. It expires in 3 minutes.`

  const response = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: [normalizedRecipient],
      sender: senderId,
      message,
      is_schedule: false,
      schedule_date: ''
    })
  })

  const rawBody = await response.text()
  let data = null
  try {
    data = rawBody ? JSON.parse(rawBody) : null
  } catch {
    data = { rawBody }
  }

  if (!response.ok) {
    return {
      success: false,
      error: data?.message || data?.error || 'mNotify request failed while sending OTP',
      providerResponse: data
    }
  }

  return { success: true, providerResponse: data }
}

export async function POST(request) {
  console.log('🔐 SIGNIN API: Request received');
  try {
    const body = await request.json()
    const { email, password, organization_id: selectedOrganizationId, otp_ticket: otpTicket } = body

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
    
    // Auto-detect account type by checking tables in priority order
    // Priority: 1) Primary accounts (developer/agency), 2) Team members, 3) Agents, 4) Property seekers
    let profile = null
    let userType = null
    let multipleOrganizations = []
    
    console.log('🔐 SIGNIN API: Auto-detecting account type...')
    
    // Check for primary accounts first (developer/agency take priority over team member)
    const { data: devCheck } = await developerDB.getByUserId(user.id)
    if (devCheck) {
      userType = 'developer'
      profile = devCheck
      console.log('🔐 SIGNIN API: Detected as developer (primary account)')
    } else {
      const { data: agencyCheck } = await supabaseAdmin
        .from('agencies')
        .select('*')
        .eq('agency_id', user.id)
        .maybeSingle()
      if (agencyCheck) {
        userType = 'agency'
        profile = agencyCheck
        console.log('🔐 SIGNIN API: Detected as agency (primary account)')
      }
    }
    
    // If no primary account, check team members
    if (!userType) {
      const { data: teamMembers, error: teamError } = await supabaseAdmin
        .from('organization_team_members')
        .select(`
          *,
          role:organization_roles(id, name, description)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (teamMembers && teamMembers.length > 0) {
        // User is a team member - check if multiple organizations
        if (teamMembers.length > 1) {
          // Multiple organizations - return list for user to select
          console.log('🔐 SIGNIN API: User belongs to multiple organizations')
          
          // Fetch organization details for each team member
          const organizations = []
          for (const member of teamMembers) {
            let orgSlug = null
            let orgName = null
            
            let developerId = null
            if (member.organization_type === 'developer') {
              const { data: devOrg } = await supabaseAdmin
                .from('developers')
                .select('slug, name, developer_id')
                .eq('id', member.organization_id)
                .single()
              orgSlug = devOrg?.slug
              orgName = devOrg?.name
              developerId = devOrg?.developer_id // Add developer_id for easy access
            } else if (member.organization_type === 'agency') {
              const { data: agencyOrg } = await supabaseAdmin
                .from('agencies')
                .select('slug, name, agency_id')
                .eq('id', member.organization_id)
                .single()
              orgSlug = agencyOrg?.slug
              orgName = agencyOrg?.name
            }
            
            organizations.push({
              id: member.id, // Team member ID
              team_member_id: member.id,
              organization_id: member.organization_id,
              organization_type: member.organization_type,
              organization_slug: orgSlug,
              organization_name: orgName,
              developer_id: developerId, // Add developer_id so components can use it directly
              role_id: member.role_id,
              role_name: member.role?.name,
              permissions: member.permissions,
              email: member.email,
              first_name: member.first_name,
              last_name: member.last_name
            })
          }
          
          // If organization_id provided, use that one
          if (selectedOrganizationId) {
            // selectedOrganizationId can be either team_member.id or organization_id
            const selectedOrg = organizations.find(org => 
              org.id === selectedOrganizationId || 
              org.team_member_id === selectedOrganizationId ||
              org.organization_id === selectedOrganizationId
            )
            if (selectedOrg) {
              userType = 'team_member'
              profile = selectedOrg
              console.log('🔐 SIGNIN API: Using selected organization')
            } else {
              // Return multiple organizations for selection
              return NextResponse.json({
                success: true,
                multipleOrganizations: true,
                organizations: organizations,
                message: 'Please select an organization to continue'
              })
            }
          } else {
            // Return multiple organizations for selection
            return NextResponse.json({
              success: true,
              multipleOrganizations: true,
              organizations: organizations,
              message: 'Please select an organization to continue'
            })
          }
        } else {
          // Single organization
          const teamMember = teamMembers[0]
          userType = 'team_member'
          
          // Get organization slug and developer_id
          let organizationSlug = null
          let organizationName = null
          let developerId = null
          if (teamMember.organization_type === 'developer') {
            const { data: devOrg } = await supabaseAdmin
              .from('developers')
              .select('slug, name, developer_id')
              .eq('id', teamMember.organization_id)
              .single()
            organizationSlug = devOrg?.slug
            organizationName = devOrg?.name
            developerId = devOrg?.developer_id // Add developer_id for easy access
          } else if (teamMember.organization_type === 'agency') {
            const { data: agencyOrg } = await supabaseAdmin
              .from('agencies')
              .select('slug, name, agency_id')
              .eq('id', teamMember.organization_id)
              .single()
            organizationSlug = agencyOrg?.slug
            organizationName = agencyOrg?.name
          }
          
          profile = {
            id: teamMember.id,
            team_member_id: teamMember.id,
            organization_type: teamMember.organization_type,
            organization_id: teamMember.organization_id,
            organization_slug: organizationSlug,
            organization_name: organizationName,
            developer_id: developerId, // Add developer_id so components can use it directly
            role_id: teamMember.role_id,
            role_name: teamMember.role?.name,
            permissions: teamMember.permissions,
            email: teamMember.email,
            first_name: teamMember.first_name,
            last_name: teamMember.last_name
          }
          console.log('🔐 SIGNIN API: Detected as team member (single organization)')
        }
      }
    }
    
    // If still no account type, check agents and property seekers
    if (!userType) {
      const { data: agentCheck } = await agentDB.getByUserId(user.id)
      if (agentCheck) {
        userType = 'agent'
        profile = agentCheck
        console.log('🔐 SIGNIN API: Detected as agent')
      } else {
        const { data: seekerCheck } = await supabase
          .from('property_seekers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (seekerCheck) {
          userType = 'property_seeker'
          profile = seekerCheck
          console.log('🔐 SIGNIN API: Detected as property_seeker')
        }
      }
    }
    
    // If no account found, return error
    if (!userType || !profile) {
      return NextResponse.json(
        { error: 'No account found for this email. Please check your email or contact support.' },
        { status: 404 }
      )
    }
    
    console.log('🔐 SIGNIN API: Final user type:', userType)

    // Profile is already set from detection above, just ensure organization details are complete for team members
    if (userType === 'team_member' && profile) {
      // Ensure organization slug and developer_id are set
      if (!profile.organization_slug || (profile.organization_type === 'developer' && !profile.developer_id)) {
        if (profile.organization_type === 'developer') {
          const { data: devOrg } = await supabaseAdmin
            .from('developers')
            .select('slug, name, developer_id')
            .eq('id', profile.organization_id)
            .single()
          if (devOrg) {
            profile.organization_slug = profile.organization_slug || devOrg?.slug
            profile.organization_name = profile.organization_name || devOrg?.name
            profile.developer_id = profile.developer_id || devOrg?.developer_id // Add developer_id if missing
          }
        } else if (profile.organization_type === 'agency') {
          const { data: agencyOrg } = await supabaseAdmin
            .from('agencies')
            .select('slug, name, agency_id')
            .eq('id', profile.organization_id)
            .single()
          if (agencyOrg) {
            profile.organization_slug = profile.organization_slug || agencyOrg?.slug
            profile.organization_name = profile.organization_name || agencyOrg?.name
          }
        }
      }
    }

    // Determine if SMS 2FA is enabled and enforce OTP challenge
    let twoFactorEnabled = false
    let otpDestinationPhone = null

    if (userType === 'team_member' && profile) {
      if (profile.organization_type === 'developer') {
        const { data: orgData } = await supabaseAdmin
          .from('developers')
          .select('settings')
          .eq('id', profile.organization_id)
          .maybeSingle()
        twoFactorEnabled = isTwoFactorSmsEnabled(orgData?.settings)
      } else if (profile.organization_type === 'agency') {
        const { data: orgData } = await supabaseAdmin
          .from('agencies')
          .select('settings')
          .eq('id', profile.organization_id)
          .maybeSingle()
        twoFactorEnabled = isTwoFactorSmsEnabled(orgData?.settings)
      }
      otpDestinationPhone = profile.phone || null
    } else {
      twoFactorEnabled = isTwoFactorSmsEnabled(profile?.settings)
      otpDestinationPhone = profile?.phone || null
    }

    if (twoFactorEnabled) {
      if (!otpDestinationPhone) {
        return NextResponse.json(
          { error: 'Two-factor authentication is enabled but no phone number is configured.' },
          { status: 400 }
        )
      }

      if (!otpTicket) {
        const otpCode = generateOtpCode()
        const ticket = crypto.randomUUID()
        const otpPayload = {
          email,
          userId: user.id,
          otpHash: hashOtp(otpCode),
          attempts: 0,
          maxAttempts: OTP_MAX_ATTEMPTS,
          createdAt: new Date().toISOString()
        }

        const saved = await setKey(`signin:otp:${ticket}`, otpPayload, { ttl: OTP_TTL_SECONDS })
        if (!saved) {
          return NextResponse.json(
            { error: 'Unable to initialize OTP verification. Please try again.' },
            { status: 500 }
          )
        }

        const smsResult = await sendOtpViaMnotify(otpDestinationPhone, otpCode)
        if (!smsResult.success) {
          await deleteKey(`signin:otp:${ticket}`)
          console.error('❌ Failed to send signin OTP via mNotify:', smsResult)
          return NextResponse.json(
            { error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: false,
          requiresOtp: true,
          otpTicket: ticket,
          expiresIn: OTP_TTL_SECONDS,
          maskedPhone: maskPhone(otpDestinationPhone)
        })
      }

      const verifiedOtp = await getKey(`signin:otp:verified:${otpTicket}`)
      if (!verifiedOtp || verifiedOtp.userId !== user.id || verifiedOtp.email !== email) {
        return NextResponse.json(
          {
            success: false,
            requiresOtp: true,
            error: 'OTP verification is required before sign in.'
          },
          { status: 401 }
        )
      }

      // One-time use ticket
      await deleteKey(`signin:otp:verified:${otpTicket}`)
    }

    // Generate JWT token for developers, agencies, agents, team members, and property seekers
    let jwtToken = null;
    if (userType === 'team_member' && profile) {
      try {
        // Get organization slug for redirect
        let organizationSlug = null
        if (profile.organization_type === 'developer') {
          const { data: devOrg } = await supabaseAdmin
            .from('developers')
            .select('slug')
            .eq('id', profile.organization_id)
            .single()
          organizationSlug = devOrg?.slug
        } else if (profile.organization_type === 'agency') {
          const { data: agencyOrg } = await supabaseAdmin
            .from('agencies')
            .select('slug')
            .eq('id', profile.organization_id)
            .single()
          organizationSlug = agencyOrg?.slug
        }

        jwtToken = generateToken({
          id: profile.id,
          user_id: user.id,
          team_member_id: profile.id,
          email: user.email,
          user_type: 'team_member',
          organization_type: profile.organization_type,
          organization_id: profile.organization_id,
          role_id: profile.role_id,
          permissions: profile.permissions,
          organization_slug: organizationSlug
        });
        console.log('JWT token generated successfully for team member:', jwtToken ? 'Yes' : 'No');
      } catch (jwtError) {
        console.error('Error generating JWT token for team member:', jwtError);
      }
    } else if (userType === 'developer' && profile) {
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

    const userId = userType === 'property_seeker' ? profile?.user_id : user.id
    captureAuditEvent('auth_signin', {
      user_id: userId,
      user_type: userType,
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/auth/signin',
      organization_type: profile?.organization_type,
    }, userId)

    // Build profile response based on user type
    let profileData = null;
    if (profile) {
      if (userType === 'team_member') {
        // Get organization details for team member
        let organizationSlug = null
        let organizationName = null
        
        if (profile.organization_type === 'developer') {
          const { data: devOrg } = await supabaseAdmin
            .from('developers')
            .select('slug, name')
            .eq('id', profile.organization_id)
            .single()
          organizationSlug = devOrg?.slug
          organizationName = devOrg?.name
        } else if (profile.organization_type === 'agency') {
          const { data: agencyOrg } = await supabaseAdmin
            .from('agencies')
            .select('slug, name')
            .eq('id', profile.organization_id)
            .single()
          organizationSlug = agencyOrg?.slug
          organizationName = agencyOrg?.name
        }

        profileData = {
          id: profile.id,
          team_member_id: profile.id,
          organization_type: profile.organization_type,
          organization_id: profile.organization_id,
          organization_slug: organizationSlug,
          organization_name: organizationName,
          role_id: profile.role_id,
          role_name: profile.role_name,
          permissions: profile.permissions,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name
        };
      } else if (userType === 'developer') {
        const statusValue = profile.admin_status || profile.status || profile.account_status || null
        profileData = {
          id: profile.id,
          developer_id: profile.developer_id,
          name: profile.name,
          slug: profile.slug,
          account_status: statusValue,
          admin_status: statusValue,
          status: statusValue
        };
      } else if (userType === 'agency') {
        const statusValue = profile.admin_status || profile.status || profile.account_status || null
        profileData = {
          id: profile.id,
          agency_id: profile.agency_id,
          name: profile.name,
          slug: profile.slug,
          account_status: statusValue,
          admin_status: statusValue,
          status: statusValue
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
