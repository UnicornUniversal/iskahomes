import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { sendAgentInvitationEmail } from '@/lib/sendgrid'
import crypto from 'crypto'

// POST - Send agent invitation
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'agency') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, location_id } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if agent with this email already exists
    const { data: existingAgent, error: checkError } = await supabaseAdmin
      .from('agents')
      .select('id, invitation_status')
      .eq('email', email)
      .eq('agency_id', decoded.user_id)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing agent:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing agent' },
        { status: 500 }
      )
    }

    // If agent exists and invitation is already accepted, return error
    if (existingAgent && existingAgent.invitation_status === 'accepted') {
      return NextResponse.json(
        { error: 'An agent with this email has already accepted an invitation' },
        { status: 400 }
      )
    }

    // Get agency details for email and company_locations
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('name, agency_id, company_locations')
      .eq('agency_id', decoded.user_id)
      .single()

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Validate location_id if provided
    let validLocationId = null
    if (location_id) {
      const locations = Array.isArray(agency.company_locations) 
        ? agency.company_locations 
        : (typeof agency.company_locations === 'string' ? JSON.parse(agency.company_locations) : [])
      
      const locationExists = locations.some(loc => loc.id === location_id)
      if (!locationExists) {
        return NextResponse.json(
          { error: 'Invalid location. Please select a location from your company locations.' },
          { status: 400 }
        )
      }
      validLocationId = location_id
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100)

    // Check if slug exists and make it unique
    let finalSlug = slug
    let slugCounter = 1
    while (true) {
      const { data: existingSlug } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()
      
      if (!existingSlug) break
      finalSlug = `${slug}-${slugCounter}`
      slugCounter++
    }

    // Prepare agent data
    const agentData = {
      agency_id: decoded.user_id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      location_id: validLocationId, // ID from agency's company_locations array
      invitation_token: invitationToken,
      invitation_expires_at: expiresAt.toISOString(),
      invitation_status: 'pending',
      invitation_sent_at: new Date().toISOString(),
      account_status: 'pending',
      agent_status: 'invited',
      slug: finalSlug
    }

    // CRITICAL: Send invitation email FIRST before creating database record
    // This ensures we only create agents if the email was successfully sent
    let emailResult
    try {
      emailResult = await sendAgentInvitationEmail(
        email,
        name,
        agency.name,
        invitationToken
      )
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error)
        return NextResponse.json(
          { error: 'Failed to send invitation email. Please try again or contact support.' },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // If agent already exists (pending invitation), update it
    if (existingAgent) {
      const { data: updatedAgent, error: updateError } = await supabaseAdmin
        .from('agents')
        .update({
          ...agentData,
          invitation_status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAgent.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating agent invitation:', updateError)
        return NextResponse.json(
          { error: 'Failed to update agent invitation' },
          { status: 500 }
        )
      }

      // Update agency total_agents count
      await supabaseAdmin.rpc('increment', {
        table_name: 'agencies',
        column_name: 'total_agents',
        id_column: 'agency_id',
        id_value: decoded.user_id,
        increment: 0 // Don't increment, just refresh
      })

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        data: updatedAgent
      })
    }

    // Create new agent record
    const { data: newAgent, error: insertError } = await supabaseAdmin
      .from('agents')
      .insert(agentData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating agent:', insertError)
      return NextResponse.json(
        { error: 'Failed to create agent invitation', details: insertError.message },
        { status: 500 }
      )
    }

    // Update agent invitation status to 'sent' after successful email
    const { error: updateStatusError } = await supabaseAdmin
      .from('agents')
      .update({ invitation_status: 'sent' })
      .eq('id', newAgent.id)

    if (updateStatusError) {
      console.error('Error updating invitation status:', updateStatusError)
    }

    // Update agency total_agents count
    const { data: agencyUpdate } = await supabaseAdmin
      .from('agencies')
      .select('total_agents')
      .eq('agency_id', decoded.user_id)
      .single()

    const newTotalAgents = (agencyUpdate?.total_agents || 0) + 1

    await supabaseAdmin
      .from('agencies')
      .update({ total_agents: newTotalAgents })
      .eq('agency_id', decoded.user_id)

    return NextResponse.json({
      success: true,
      message: 'Agent invitation sent successfully',
      data: {
        ...newAgent,
        invitation_status: 'sent'
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

