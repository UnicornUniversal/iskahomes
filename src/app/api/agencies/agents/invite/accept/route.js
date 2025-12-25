import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// GET - Verify invitation token and get agent details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find agent by invitation token
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*, agencies:agency_id(name, agency_id, company_locations)')
      .eq('invitation_token', token)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date(agent.invitation_expires_at) < new Date()) {
      // Update status to expired
      await supabaseAdmin
        .from('agents')
        .update({ invitation_status: 'expired' })
        .eq('id', agent.id)

      return NextResponse.json(
        { error: 'This invitation has expired. Please contact the agency for a new invitation.' },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (agent.invitation_status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Return agent details (without sensitive info)
    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        agency_name: agent.agencies?.name,
        agency_id: agent.agency_id
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Accept invitation and create account
export async function POST(request) {
  try {
    const body = await request.json()
    const { token, password, fullName } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Find agent by invitation token
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*, agencies:agency_id(name, agency_id, company_locations)')
      .eq('invitation_token', token)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date(agent.invitation_expires_at) < new Date()) {
      await supabaseAdmin
        .from('agents')
        .update({ invitation_status: 'expired' })
        .eq('id', agent.id)

      return NextResponse.json(
        { error: 'This invitation has expired. Please contact the agency for a new invitation.' },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (agent.invitation_status === 'accepted' && agent.agent_id) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Create Supabase client for auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if user already exists
    let userId = null
    try {
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(agent.email)
      
      if (!getUserError && existingUser?.user) {
        userId = existingUser.user.id
      }
    } catch (err) {
      // User doesn't exist, continue to create
      console.log('User does not exist, will create new account')
    }

    const agentName = fullName?.trim() || agent.name

    if (!userId) {
      // Create new user in Supabase Auth
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: agent.email,
        password: password,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_LINK}/agent/invitation/accept?token=${token}`,
          data: {
            user_type: 'agent',
            full_name: agentName
          }
        }
      })

      if (signUpError || !newUser?.user) {
        console.error('Error creating user:', signUpError)
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.' },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      // Auto-confirm email for agents (they were invited, so no need for email confirmation)
      // Also set display name
      try {
        const { data: updatedUser, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            email_confirm: true,
            user_metadata: {
              user_type: 'agent',
              full_name: agentName
            }
          }
        )

        if (confirmError) {
          console.error('Error confirming agent email:', confirmError)
          // Check if email confirmation is actually needed
          const emailConfirmed = updatedUser?.user?.email_confirmed_at
          if (!emailConfirmed) {
            // Email confirmation is required by Supabase settings
            // Return success but indicate email confirmation is needed
            return NextResponse.json({
              success: true,
              message: 'Account created successfully',
              data: {
                agent_id: userId,
                email: agent.email,
                name: agentName,
                email_confirmation_required: true
              }
            })
          }
        } else {
          console.log('✅ Agent email auto-confirmed successfully')
        }
      } catch (confirmErr) {
        console.error('Error in email confirmation process:', confirmErr)
        // Return success but indicate email confirmation might be needed
        return NextResponse.json({
          success: true,
          message: 'Account created successfully',
          data: {
            agent_id: userId,
            email: agent.email,
            name: agentName,
            email_confirmation_required: true
          }
        })
      }
    } else {
      // User already exists - ensure email is confirmed and metadata is set
      try {
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId)
        const emailConfirmed = existingUser?.user?.email_confirmed_at

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            email_confirm: true,
            user_metadata: {
              user_type: 'agent',
              full_name: agentName
            }
          }
        )

        if (updateError) {
          console.error('Error updating existing user:', updateError)
        }

        // Check if email confirmation is still needed
        const { data: updatedUser } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (!updatedUser?.user?.email_confirmed_at && !emailConfirmed) {
          return NextResponse.json({
            success: true,
            message: 'Account updated successfully',
            data: {
              agent_id: userId,
              email: agent.email,
              name: agentName,
              email_confirmation_required: true
            }
          })
        }
      } catch (updateErr) {
        console.error('Error updating existing user metadata:', updateErr)
      }
    }

    // Generate slug if not exists
    let slug = agent.slug
    if (!slug) {
      const nameToSlug = (fullName || agent.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100)

      let finalSlug = nameToSlug
      let slugCounter = 1
      while (true) {
        const { data: existingSlug } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', agent.id)
          .maybeSingle()
        
        if (!existingSlug) break
        finalSlug = `${nameToSlug}-${slugCounter}`
        slugCounter++
      }
      slug = finalSlug
    }

    // Update agent record
    const updateData = {
      agent_id: userId,
      invitation_status: 'accepted',
      invitation_accepted_at: new Date().toISOString(),
      account_status: 'active',
      agent_status: 'active',
      commission_status: true, // Set commission status to true on signup
      slug: slug,
      invitation_token: null, // Clear token
      invitation_expires_at: null, // Clear expiry
      updated_at: new Date().toISOString()
    }

    if (fullName && fullName.trim() !== agent.name) {
      updateData.name = fullName.trim()
    }

    const { data: updatedAgent, error: updateError } = await supabaseAdmin
      .from('agents')
      .update(updateData)
      .eq('id', agent.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating agent:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      )
    }

    // Update agency active_agents count
    const { data: agencyUpdate } = await supabaseAdmin
      .from('agencies')
      .select('active_agents')
      .eq('agency_id', agent.agency_id)
      .single()

    const newActiveAgents = (agencyUpdate?.active_agents || 0) + 1

    await supabaseAdmin
      .from('agencies')
      .update({ active_agents: newActiveAgents })
      .eq('agency_id', agent.agency_id)

    // Check final email confirmation status
    let emailConfirmationRequired = false
    try {
      const { data: finalUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      emailConfirmationRequired = !finalUser?.user?.email_confirmed_at
    } catch (err) {
      console.error('Error checking email confirmation:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        agent_id: userId,
        email: agent.email,
        name: updatedAgent.name,
        email_confirmation_required: emailConfirmationRequired
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

