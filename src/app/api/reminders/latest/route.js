import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/reminders/latest - Fetch latest reminders with joins to leads and listings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'user_id and user_type are required' },
        { status: 400 }
      )
    }

    // Fetch reminders with leads in one query
    const { data: reminders, error } = await supabaseAdmin
      .from('reminders')
      .select(`
        *,
        leads (
          id,
          seeker_id,
          listing_id,
          lister_id,
          lister_type,
          first_action_date,
          last_action_date,
          lead_score,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('status', 'incomplete')
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reminders', details: error.message },
        { status: 500 }
      )
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      })
    }

    // Get unique listing IDs from leads
    const listingIds = [...new Set(
      reminders
        .map(r => r.leads?.listing_id)
        .filter(Boolean)
    )]

    // Fetch listings in one query
    let listingsMap = {}
    if (listingIds.length > 0) {
      const { data: listings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('id, title, location, property_type, listing_type, images, slug')
        .in('id', listingIds)

      if (!listingsError && listings) {
        listingsMap = listings.reduce((acc, listing) => {
          acc[listing.id] = listing
          return acc
        }, {})
      }
    }

    // Calculate overdue status and format response
    const now = new Date()
    const enrichedReminders = reminders.map(reminder => {
      const lead = reminder.leads || null
      const listing = lead?.listing_id ? listingsMap[lead.listing_id] : null
      
      // Calculate overdue status
      let isOverdue = false
      if (reminder.reminder_date) {
        const reminderDate = new Date(reminder.reminder_date)
        if (reminder.reminder_time) {
          const [hours, minutes] = reminder.reminder_time.split(':')
          reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        } else {
          reminderDate.setHours(23, 59, 59, 999) // End of day if no time
        }
        isOverdue = reminderDate < now
      }

      return {
        ...reminder,
        is_overdue: isOverdue,
        lead: lead ? {
          id: lead.id,
          seeker_id: lead.seeker_id,
          listing_id: lead.listing_id,
          lister_id: lead.lister_id,
          lister_type: lead.lister_type,
          first_action_date: lead.first_action_date,
          last_action_date: lead.last_action_date,
          lead_score: lead.lead_score,
          status: lead.status
        } : null,
        listing: listing ? {
          id: listing.id,
          title: listing.title,
          location: listing.location,
          property_type: listing.property_type,
          listing_type: listing.listing_type,
          images: listing.images,
          slug: listing.slug
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedReminders,
      count: enrichedReminders.length
    })
  } catch (error) {
    console.error('Error in GET /api/reminders/latest:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

