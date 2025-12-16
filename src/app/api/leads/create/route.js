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

    // Determine if this is an anonymous lead
    // is_anonymous = !is_logged_in (if user is not logged in, they are anonymous)
    const is_anonymous = !is_logged_in

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
          is_anonymous: is_anonymous, // Update is_anonymous (in case user logged in/out)
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
        is_anonymous: is_anonymous, // Set is_anonymous based on is_logged_in
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

    // Update listing's total_leads and unique_leads/anonymous_leads if this is a listing lead
    // Only increment unique_leads or anonymous_leads if this is a NEW lead (not updating existing)
    if (context_type === 'listing' && listing_id && !existingLead) {
      try {
        const { data: listing, error: listingError } = await supabaseAdmin
          .from('listings')
          .select('id, user_id, account_type, total_leads, unique_leads, anonymous_leads')
          .eq('id', listing_id)
          .single()

        if (!listingError && listing) {
          const newTotalLeads = (listing.total_leads || 0) + 1
          const updateData = { total_leads: newTotalLeads }
          
          // Increment unique_leads or anonymous_leads based on is_anonymous
          if (is_anonymous) {
            updateData.anonymous_leads = (listing.anonymous_leads || 0) + 1
          } else {
            updateData.unique_leads = (listing.unique_leads || 0) + 1
          }
          
          const { error: updateListingError } = await supabaseAdmin
            .from('listings')
            .update(updateData)
            .eq('id', listing_id)

          if (updateListingError) {
            console.error('Error updating listing leads:', updateListingError)
            // Don't fail the request, just log the error
          }

          // HYBRID APPROACH: Also update the developer's aggregate fields (total_unique_leads/total_anonymous_leads)
          // if this listing is owned by a developer
          if (listing.user_id && listing.account_type === 'developer') {
            try {
              const { data: developerData, error: developerFetchError } = await supabaseAdmin
                .from('developers')
                .select('total_unique_leads, total_anonymous_leads')
                .eq('developer_id', listing.user_id)
                .single()

              if (!developerFetchError && developerData) {
                const developerUpdateData = {}
                // Increment aggregate fields (cron job will deduplicate if needed)
                if (is_anonymous) {
                  developerUpdateData.total_anonymous_leads = (developerData.total_anonymous_leads || 0) + 1
                } else {
                  developerUpdateData.total_unique_leads = (developerData.total_unique_leads || 0) + 1
                }

                const { error: developerUpdateError } = await supabaseAdmin
                  .from('developers')
                  .update(developerUpdateData)
                  .eq('developer_id', listing.user_id)

                if (developerUpdateError) {
                  console.error('Error updating developer aggregate leads from listing:', developerUpdateError)
                }
              }
            } catch (err) {
              console.error('Exception updating developer aggregate leads from listing:', err)
            }
          }
        }
      } catch (err) {
        console.error('Exception updating listing leads:', err)
        // Don't fail the request, just log the error
      }
    }

    // Update developers/agents table totals immediately
    // HYBRID APPROACH: Update both profile-specific AND aggregate fields
    // Only increment unique_leads or anonymous_leads if this is a NEW lead (not updating existing)
    if (!existingLead) {
      try {
        // Get current totals from developers/agents table
        const tableName = lister_type === 'developer' ? 'developers' : 'agents'
        const idField = lister_type === 'developer' ? 'developer_id' : 'agent_id'

        const { data: listerData, error: fetchError } = await supabaseAdmin
          .from(tableName)
          .select(`total_leads, unique_leads, anonymous_leads, total_unique_leads, total_anonymous_leads, leads_breakdown`)
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

          // Prepare update data
          const updateData = {
            total_leads: currentTotalLeads,
            leads_breakdown: breakdown,
            updated_at: actionTimestamp
          }

          // HYBRID APPROACH: Update profile-specific fields (only for profile leads)
          if (context_type === 'profile') {
            // Increment profile-specific unique_leads or anonymous_leads
            if (is_anonymous) {
              updateData.anonymous_leads = (listerData.anonymous_leads || 0) + 1
            } else {
              updateData.unique_leads = (listerData.unique_leads || 0) + 1
            }
          }

          // HYBRID APPROACH: Always update aggregate fields (total_unique_leads/total_anonymous_leads)
          // This applies to ALL contexts: profile, listing, and development leads
          // Check if this seeker_id is already counted in aggregate (to avoid double-counting)
          // We need to check if this seeker_id already exists in leads table for this developer
          // For real-time updates, we'll increment and let the cron job deduplicate
          // This is a trade-off: real-time updates may slightly over-count, but cron will correct it
          if (is_anonymous) {
            updateData.total_anonymous_leads = (listerData.total_anonymous_leads || 0) + 1
          } else {
            updateData.total_unique_leads = (listerData.total_unique_leads || 0) + 1
          }

          // Update total_leads, unique_leads/anonymous_leads, total_unique_leads/total_anonymous_leads, and leads_breakdown
          const { error: updateError } = await supabaseAdmin
            .from(tableName)
            .update(updateData)
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
    }

    // Update developments table totals if this is a development lead
    // Only increment unique_leads or anonymous_leads if this is a NEW lead (not updating existing)
    if (context_type === 'development' && development_id && !existingLead) {
      try {
        const { data: development, error: developmentError } = await supabaseAdmin
          .from('developments')
          .select('id, developer_id, total_leads, unique_leads, anonymous_leads')
          .eq('id', development_id)
          .single()

        if (!developmentError && development) {
          const newTotalLeads = (development.total_leads || 0) + 1
          const updateData = { total_leads: newTotalLeads }
          
          // Increment unique_leads or anonymous_leads based on is_anonymous
          if (is_anonymous) {
            updateData.anonymous_leads = (development.anonymous_leads || 0) + 1
          } else {
            updateData.unique_leads = (development.unique_leads || 0) + 1
          }
          
          const { error: updateDevelopmentError } = await supabaseAdmin
            .from('developments')
            .update(updateData)
            .eq('id', development_id)

          if (updateDevelopmentError) {
            console.error('Error updating development leads:', updateDevelopmentError)
            // Don't fail the request, just log the error
          }

          // HYBRID APPROACH: Also update the developer's aggregate fields (total_unique_leads/total_anonymous_leads)
          // if this development is owned by a developer
          if (development.developer_id) {
            try {
              const { data: developerData, error: developerFetchError } = await supabaseAdmin
                .from('developers')
                .select('total_unique_leads, total_anonymous_leads')
                .eq('developer_id', development.developer_id)
                .single()

              if (!developerFetchError && developerData) {
                const developerUpdateData = {}
                // Increment aggregate fields (cron job will deduplicate if needed)
                if (is_anonymous) {
                  developerUpdateData.total_anonymous_leads = (developerData.total_anonymous_leads || 0) + 1
                } else {
                  developerUpdateData.total_unique_leads = (developerData.total_unique_leads || 0) + 1
                }

                const { error: developerUpdateError } = await supabaseAdmin
                  .from('developers')
                  .update(developerUpdateData)
                  .eq('developer_id', development.developer_id)

                if (developerUpdateError) {
                  console.error('Error updating developer aggregate leads from development:', developerUpdateError)
                }
              }
            } catch (err) {
              console.error('Exception updating developer aggregate leads from development:', err)
            }
          }
        }
      } catch (err) {
        console.error('Exception updating development leads:', err)
        // Don't fail the request, just log the error
      }
    }

    // Update developments table totals if this is a development lead
    // Only increment unique_leads or anonymous_leads if this is a NEW lead (not updating existing)
    if (context_type === 'development' && development_id && !existingLead) {
      try {
        const { data: development, error: developmentError } = await supabaseAdmin
          .from('developments')
          .select('id, developer_id, total_leads, unique_leads, anonymous_leads')
          .eq('id', development_id)
          .single()

        if (!developmentError && development) {
          const newTotalLeads = (development.total_leads || 0) + 1
          const updateData = { total_leads: newTotalLeads }
          
          // Increment unique_leads or anonymous_leads based on is_anonymous
          if (is_anonymous) {
            updateData.anonymous_leads = (development.anonymous_leads || 0) + 1
          } else {
            updateData.unique_leads = (development.unique_leads || 0) + 1
          }
          
          const { error: updateDevelopmentError } = await supabaseAdmin
            .from('developments')
            .update(updateData)
            .eq('id', development_id)

          if (updateDevelopmentError) {
            console.error('Error updating development leads:', updateDevelopmentError)
            // Don't fail the request, just log the error
          }

          // HYBRID APPROACH: Also update the developer's aggregate fields (total_unique_leads/total_anonymous_leads)
          // if this development is owned by a developer
          if (development.developer_id) {
            try {
              const { data: developerData, error: developerFetchError } = await supabaseAdmin
                .from('developers')
                .select('total_unique_leads, total_anonymous_leads')
                .eq('developer_id', development.developer_id)
                .single()

              if (!developerFetchError && developerData) {
                const developerUpdateData = {}
                // Increment aggregate fields (cron job will deduplicate if needed)
                if (is_anonymous) {
                  developerUpdateData.total_anonymous_leads = (developerData.total_anonymous_leads || 0) + 1
                } else {
                  developerUpdateData.total_unique_leads = (developerData.total_unique_leads || 0) + 1
                }

                const { error: developerUpdateError } = await supabaseAdmin
                  .from('developers')
                  .update(developerUpdateData)
                  .eq('developer_id', development.developer_id)

                if (developerUpdateError) {
                  console.error('Error updating developer aggregate leads from development:', developerUpdateError)
                }
              }
            } catch (err) {
              console.error('Exception updating developer aggregate leads from development:', err)
            }
          }
        }
      } catch (err) {
        console.error('Exception updating development leads:', err)
        // Don't fail the request, just log the error
      }
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
