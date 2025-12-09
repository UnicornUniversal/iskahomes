import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

/**
 * Real-time lead creation endpoint
 * Creates leads immediately when user actions occur (phone, message, appointment)
 * Also updates developers/agents table totals immediately
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      lead_type, // 'phone', 'message', 'appointment'
      context_type, // 'listing', 'profile', 'development'
      listing_id,
      profile_id,
      development_id,
      lister_id,
      lister_type, // 'developer', 'agent', 'agency'
      seeker_id,
      action, // For phone: 'click' or 'copy'
      message_type, // For message: 'direct_message', 'whatsapp', 'email'
      appointment_type, // For appointment: 'viewing', 'consultation', etc.
      phone_number,
      is_logged_in = false,
      timestamp
    } = body

    // Validation
    if (!lead_type || !lister_id || !lister_type) {
      return NextResponse.json(
        { error: 'Missing required fields: lead_type, lister_id, lister_type' },
        { status: 400 }
      )
    }

    // Validate context_type (customer_care is not a lead - it's still a profile view)
    if (!context_type || !['listing', 'profile', 'development'].includes(context_type)) {
      return NextResponse.json(
        { error: 'Invalid context_type. Must be: listing, profile, or development' },
        { status: 400 }
      )
    }

    // Validate that at least one context ID is provided
    if (context_type === 'listing' && !listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required when context_type is "listing"' },
        { status: 400 }
      )
    }
    if (context_type === 'development' && !development_id) {
      return NextResponse.json(
        { error: 'development_id is required when context_type is "development"' },
        { status: 400 }
      )
    }

    // Get seeker_id from request or generate anonymous ID
    let finalSeekerId = seeker_id
    if (!finalSeekerId) {
      // Generate anonymous seeker ID (could be from session/cookie)
      // For now, we'll require seeker_id or use a placeholder
      return NextResponse.json(
        { error: 'seeker_id is required' },
        { status: 400 }
      )
    }

    // Determine action type and metadata
    let actionType = 'lead_unknown'
    let actionMetadata = {}

    if (lead_type === 'phone') {
      actionType = 'lead_phone'
      actionMetadata = {
        action: action || 'click',
        phone_number: phone_number || null
      }
    } else if (lead_type === 'message') {
      actionType = 'lead_message'
      actionMetadata = {
        message_type: message_type || 'direct_message'
      }
    } else if (lead_type === 'appointment') {
      actionType = 'lead_appointment'
      actionMetadata = {
        appointment_type: appointment_type || 'viewing'
      }
    }

    // Calculate lead score based on action type
    const leadScoreMap = {
      'lead_phone': 10,
      'lead_message': message_type === 'email' ? 10 : (message_type === 'whatsapp' ? 15 : 20),
      'lead_appointment': 25
    }
    const leadScore = leadScoreMap[actionType] || 10

    // Get current date and hour
    const now = new Date(timestamp ? new Date(timestamp) : new Date())
    const actionDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const actionHour = now.getHours()
    const actionTimestamp = now.toISOString()

    // Create action object
    const actionObj = {
      action_id: crypto.randomUUID(),
      action_type: actionType,
      action_date: actionDate.replace(/-/g, ''), // YYYYMMDD format
      action_hour: actionHour,
      action_timestamp: actionTimestamp,
      action_metadata: {
        context_type,
        ...actionMetadata
      }
    }

    // Check if lead already exists for this seeker+context combination
    // For listing: (listing_id, seeker_id)
    // For profile: (lister_id, seeker_id) where listing_id IS NULL
    // For development: (development_id, seeker_id)
    let existingLead = null
    
    if (context_type === 'listing' && listing_id) {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('listing_id', listing_id)
        .eq('seeker_id', finalSeekerId)
        .eq('context_type', 'listing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      existingLead = leads
    } else if (context_type === 'profile') {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('lister_id', lister_id)
        .eq('seeker_id', finalSeekerId)
        .eq('context_type', 'profile')
        .is('listing_id', null)
        .is('development_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      existingLead = leads
    } else if (context_type === 'development' && development_id) {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('development_id', development_id)
        .eq('seeker_id', finalSeekerId)
        .eq('context_type', 'development')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      existingLead = leads
    }

    let leadRecord = null

    if (existingLead) {
      // Update existing lead: add new action to lead_actions array
      const updatedActions = [
        ...(Array.isArray(existingLead.lead_actions) ? existingLead.lead_actions : []),
        actionObj
      ]

      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          lead_actions: updatedActions,
          total_actions: updatedActions.length,
          last_action_date: actionDate,
          last_action_type: actionType,
          lead_score: Math.max(existingLead.lead_score || 0, leadScore), // Keep highest score
          updated_at: actionTimestamp
        })
        .eq('id', existingLead.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating lead:', updateError)
        return NextResponse.json(
          { error: 'Failed to update lead', details: updateError.message },
          { status: 500 }
        )
      }

      leadRecord = updatedLead
    } else {
      // Create new lead record
      const newLead = {
        listing_id: context_type === 'listing' ? listing_id : null,
        development_id: context_type === 'development' ? development_id : null,
        lister_id: lister_id,
        lister_type: lister_type,
        seeker_id: finalSeekerId,
        context_type: context_type,
        lead_actions: [actionObj],
        total_actions: 1,
        lead_score: leadScore,
        first_action_date: actionDate,
        last_action_date: actionDate,
        last_action_type: actionType,
        status: 'new',
        status_tracker: ['new'],
        notes: [],
        date: actionDate, // For hourly queries
        hour: actionHour, // For hourly queries
        created_at: actionTimestamp,
        updated_at: actionTimestamp
      }

      const { data: createdLead, error: createError } = await supabaseAdmin
        .from('leads')
        .insert(newLead)
        .select()
        .single()

      if (createError) {
        console.error('Error creating lead:', createError)
        return NextResponse.json(
          { error: 'Failed to create lead', details: createError.message },
          { status: 500 }
        )
      }

      leadRecord = createdLead
    }

    // Update developers/agents table totals immediately
    try {
      // Get current totals from developers/agents table
      const tableName = lister_type === 'developer' ? 'developers' : 'agents'
      const idField = lister_type === 'developer' ? 'developer_id' : 'agent_id'

      const { data: listerData, error: fetchError } = await supabaseAdmin
        .from(tableName)
        .select(`total_leads, leads_breakdown`)
        .eq(idField, lister_id)
        .single()

      if (!fetchError && listerData) {
        const currentTotalLeads = (listerData.total_leads || 0) + 1

        // Update leads breakdown
        const currentBreakdown = listerData.leads_breakdown || {}
        const breakdown = { ...currentBreakdown }

        // Update breakdown based on lead type
        if (lead_type === 'phone') {
          breakdown.phone = {
            total: ((breakdown.phone?.total || 0) + 1),
            percentage: 0 // Will be recalculated by cron
          }
          breakdown.phone_leads = breakdown.phone // Backward compatibility
        } else if (lead_type === 'message') {
          const messageTotal = (breakdown.message_leads?.total || 0) + 1
          breakdown.message_leads = {
            total: messageTotal,
            percentage: 0 // Will be recalculated by cron
          }
          
          if (message_type === 'whatsapp') {
            breakdown.whatsapp = {
              total: ((breakdown.whatsapp?.total || 0) + 1),
              percentage: 0
            }
          } else if (message_type === 'direct_message') {
            breakdown.direct_message = {
              total: ((breakdown.direct_message?.total || 0) + 1),
              percentage: 0
            }
          }
        } else if (lead_type === 'appointment') {
          breakdown.appointment = {
            total: ((breakdown.appointment?.total || 0) + 1),
            percentage: 0
          }
          breakdown.appointment_leads = breakdown.appointment // Backward compatibility
        }

        // Update total_leads and leads_breakdown
        const { error: updateError } = await supabaseAdmin
          .from(tableName)
          .update({
            total_leads: currentTotalLeads,
            leads_breakdown: breakdown,
            updated_at: actionTimestamp
          })
          .eq(idField, lister_id)

        if (updateError) {
          console.error(`Error updating ${tableName} totals:`, updateError)
          // Don't fail the request, just log the error
        }
      }
    } catch (err) {
      console.error('Exception updating lister totals:', err)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      lead: leadRecord,
      message: existingLead ? 'Lead updated with new action' : 'New lead created'
    })

  } catch (error) {
    console.error('Error in POST /api/leads/create:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
