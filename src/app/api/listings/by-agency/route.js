import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get user info
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const listingType = searchParams.get('listing_type') || 'property'

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    // Build query for listings belonging to this agency
    let query = supabase
      .from('listings')
      .select('*')
      .eq('listing_agency_id', agencyId) // Filter by agency's ID
      .order('created_at', { ascending: false })

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching agency listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: listings || []
    })

  } catch (error) {
    console.error('Agency listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

