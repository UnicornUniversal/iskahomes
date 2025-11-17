import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    console.log('Fetching all listings from /api/get-listings...')
    
    // Fetch listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false })

    console.log('Listings fetched:', listings?.length || 0)

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error },
        { status: 500 }
      )
    }

    // Fetch all property purposes for lookup
    const { data: purposes, error: purposesError } = await supabase
      .from('property_purposes')
      .select('id, name')

    if (purposesError) {
      console.error('Error fetching purposes:', purposesError)
    }

    // Create a map of purpose IDs to names
    const purposeMap = new Map()
    if (purposes) {
      purposes.forEach(p => {
        purposeMap.set(p.id, p.name)
      })
    }

    // Enrich listings with purpose names
    const enrichedListings = (listings || []).map(listing => {
      const enriched = { ...listing }
      
      // Parse purposes array and get names
      if (listing.purposes) {
        try {
          const purposeIds = typeof listing.purposes === 'string' 
            ? JSON.parse(listing.purposes) 
            : listing.purposes
          
          if (Array.isArray(purposeIds)) {
            enriched.purpose_names = purposeIds
              .map(id => purposeMap.get(id))
              .filter(Boolean)
            enriched.purpose_name = enriched.purpose_names[0] || null // Primary purpose
          }
        } catch (e) {
          console.error('Error parsing purposes:', e)
          enriched.purpose_names = []
          enriched.purpose_name = null
        }
      }
      
      return enriched
    })

    return NextResponse.json({
      success: true,
      data: enrichedListings,
      total: enrichedListings.length
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
