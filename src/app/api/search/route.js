import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

/**
 * Search API Route
 * Searches listings and developments based on user type
 * - Developers: Search both listings and developments
 * - Other users: Search only listings
 * 
 * Headers required:
 * - Authorization: Bearer {token}
 * - x-user-id: {user_id}
 * - x-user-type: {user_type}
 * 
 * Query params:
 * - query: Search term
 * - limit: Number of results (default: 10)
 */
export async function GET(request) {
  try {
    // Get user info from headers
    const authHeader = request.headers.get('authorization')
    const userId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', auth_failed: true },
        { status: 401 }
      )
    }

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type are required in headers' },
        { status: 400 }
      )
    }

    // Verify token
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token', auth_failed: true },
        { status: 401 }
      )
    }

    // Get search query and limit
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!searchQuery.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          listings: [],
          developments: []
        }
      })
    }

    const results = {
      listings: [],
      developments: []
    }

    // Search listings (for all user types)
    try {
      let listingsQuery = supabase
        .from('listings')
        .select('id, title, slug, listing_type, price, currency, city, state, country, media, listing_status')
        .eq('listing_status', 'active')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`)
        .limit(limit)

      // If user is developer, only show their own listings
      // If user is other type, show all active listings
      if (userType === 'developer') {
        listingsQuery = listingsQuery.eq('user_id', userId)
      }

      const { data: listings, error: listingsError } = await listingsQuery

      if (listingsError) {
        console.error('Error searching listings:', listingsError)
      } else {
        results.listings = listings || []
      }
    } catch (listingsErr) {
      console.error('Error in listings search:', listingsErr)
    }

    // Search developments (only for developers)
    if (userType === 'developer') {
      try {
        const { data: developments, error: developmentsError } = await supabase
          .from('developments')
          .select('id, title, slug, city, state, country, town, status')
          .eq('developer_id', userId)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,town.ilike.%${searchQuery}%`)
          .limit(limit)

        if (developmentsError) {
          console.error('Error searching developments:', developmentsError)
        } else {
          results.developments = developments || []
        }
      } catch (developmentsErr) {
        console.error('Error in developments search:', developmentsErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      query: searchQuery
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

