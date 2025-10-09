import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Fetch the listing
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('listing_status', 'published')
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // If it's a unit, fetch developer details separately
    let developer = null
    if (listing.listing_type === 'unit' && listing.user_id) {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .select(`
          id,
          name,
          slug,
          profile_image,
          cover_image,
          email,
          phone,
          website,
          description,
          total_developments,
          total_units
        `)
        .eq('developer_id', listing.user_id)
        .single()

      if (!devError) {
        developer = devData
      }
    }

    // If it's a unit, fetch related listings by the same developer
    let relatedListings = []
    if (listing.listing_type === 'unit' && listing.user_id) {
      const { data: related, error: relatedError } = await supabase
      .from('listings')
        .select(`
          id,
          title,
          slug,
          listing_type,
          price,
          currency,
          price_type,
          duration,
          media,
          specifications,
          city,
          state,
          country
        `)
        .eq('user_id', listing.user_id)
        .eq('listing_status', 'published')
        .neq('id', id)
        .limit(6)

      if (!relatedError) {
        relatedListings = related || []
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...listing,
        developers: developer,
        relatedListings
      }
    })

  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}