import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/reminders - Fetch reminders for a grouped lead or user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupedLeadKey = searchParams.get('grouped_lead_key')
    const leadId = searchParams.get('lead_id')
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type')
    const limit = searchParams.get('limit')

    // Validate: need at least one filter
    if (!groupedLeadKey && !leadId && !userId) {
      return NextResponse.json(
        { error: 'grouped_lead_key, lead_id, or user_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('reminders')
      .select('*')
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true, nullsFirst: false })

    if (groupedLeadKey) {
      query = query.eq('grouped_lead_key', groupedLeadKey)
    } else if (leadId) {
      query = query.eq('lead_id', leadId)
    } else if (userId) {
      query = query.eq('user_id', userId)
      if (userType) {
        query = query.eq('user_type', userType)
      }
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: reminders, error } = await query

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reminders', details: error.message },
        { status: 500 }
      )
    }

    // Calculate overdue status for incomplete reminders
    const now = new Date()
    const remindersWithStatus = (reminders || []).map(reminder => {
      if (reminder.status === 'incomplete' && reminder.reminder_date) {
        const reminderDate = new Date(reminder.reminder_date)
        if (reminder.reminder_time) {
          const [hours, minutes] = reminder.reminder_time.split(':')
          reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        } else {
          reminderDate.setHours(23, 59, 59, 999) // End of day if no time
        }
        const isOverdue = reminderDate < now
        return { ...reminder, is_overdue: isOverdue }
      }
      return { ...reminder, is_overdue: false }
    })

    // If fetching by user_id, enrich with listing information
    if (userId && remindersWithStatus.length > 0) {
      // Get unique lead_ids to fetch listing_ids
      const leadIds = remindersWithStatus
        .map(r => r.lead_id)
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index) // Unique IDs

      // Fetch leads to get listing_ids
      let leadListingMap = {}
      if (leadIds.length > 0) {
        const { data: leads, error: leadsError } = await supabaseAdmin
          .from('leads')
          .select('id, listing_id')
          .in('id', leadIds)

        if (!leadsError && leads) {
          leads.forEach(lead => {
            if (lead.listing_id) {
              leadListingMap[lead.id] = lead.listing_id
            }
          })
        }
      }

      // Extract listing IDs from both leadListingMap and grouped_lead_key
      const listingIds = new Set()
      remindersWithStatus.forEach(r => {
        // Try to get from lead_id first
        if (r.lead_id && leadListingMap[r.lead_id]) {
          listingIds.add(leadListingMap[r.lead_id])
        }
        // Fallback to grouped_lead_key
        else if (r.grouped_lead_key) {
          const parts = r.grouped_lead_key.split('_')
          const listingId = parts[parts.length - 1]
          if (listingId && listingId !== 'null') {
            listingIds.add(listingId)
          }
        }
      })

      // Fetch listings
      let listingsMap = {}
      if (listingIds.size > 0) {
        const { data: listings, error: listingsError } = await supabaseAdmin
          .from('listings')
          .select('id, title, city, state, town, country, full_address, size, specifications')
          .in('id', Array.from(listingIds))

        if (!listingsError && listings) {
          listings.forEach(listing => {
            listingsMap[listing.id] = {
              id: listing.id,
              title: listing.title || 'Untitled Property',
              city: listing.city,
              state: listing.state,
              town: listing.town,
              country: listing.country,
              full_address: listing.full_address,
              size: listing.size,
              specifications: listing.specifications
            }
          })
        }
      }

      // Attach listing info to reminders
      const enrichedReminders = remindersWithStatus.map(reminder => {
        let listing = null
        // Try to get from lead_id first
        if (reminder.lead_id && leadListingMap[reminder.lead_id] && listingsMap[leadListingMap[reminder.lead_id]]) {
          listing = listingsMap[leadListingMap[reminder.lead_id]]
        }
        // Fallback to grouped_lead_key
        else if (reminder.grouped_lead_key) {
          const parts = reminder.grouped_lead_key.split('_')
          const listingId = parts[parts.length - 1]
          if (listingId && listingId !== 'null' && listingsMap[listingId]) {
            listing = listingsMap[listingId]
          }
        }
        return { ...reminder, listing }
      })

      return NextResponse.json({
        success: true,
        data: enrichedReminders
      })
    }

    return NextResponse.json({
      success: true,
      data: remindersWithStatus
    })
  } catch (error) {
    console.error('Error in GET /api/reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request) {
  try {
    const body = await request.json()
    const { lead_id, grouped_lead_key, note_text, reminder_date, reminder_time, priority } = body

    // Validation
    if (!lead_id || !grouped_lead_key || !note_text || !reminder_date) {
      return NextResponse.json(
        { error: 'lead_id, grouped_lead_key, note_text, and reminder_date are required' },
        { status: 400 }
      )
    }

    // Verify the lead exists
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, seeker_id, listing_id')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Create reminder
    // Include user_id and user_type if provided
    const { user_id, user_type } = body
    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .insert({
        lead_id,
        grouped_lead_key,
        note_text,
        reminder_date,
        reminder_time: reminder_time || null,
        priority: priority || 'normal',
        status: 'incomplete',
        user_id: user_id || null,
        user_type: user_type || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return NextResponse.json(
        { error: 'Failed to create reminder', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reminder
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

