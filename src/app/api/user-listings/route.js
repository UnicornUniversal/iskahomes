import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

export async function GET(request) {
  try {
    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status: authStatus } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Get the actual developer's user_id
    const userId = await getDeveloperId(userInfo)
    
    if (!userId) {
      return NextResponse.json({ error: 'Developer ID not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const listingType = searchParams.get('listing_type') || ''
    const status = searchParams.get('status') || ''
    const purpose = searchParams.get('purpose') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const priceMin = searchParams.get('price_min') || ''
    const priceMax = searchParams.get('price_max') || ''
    const priceType = searchParams.get('price_type') || ''
    const offset = (page - 1) * limit

    // Build query for listings belonging to this user
    let query = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId) // Filter by user's ID
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    if (status) {
      query = query.eq('listing_status', status)
    }

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }

    if (priceMin) {
      query = query.gte('price', priceMin)
    }

    if (priceMax) {
      query = query.lte('price', priceMax)
    }

    if (priceType) {
      query = query.eq('price_type', priceType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching user listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (listingType) {
      countQuery = countQuery.eq('listing_type', listingType)
    }
    if (status) {
      countQuery = countQuery.eq('listing_status', status)
    }
    if (purpose) {
      countQuery = countQuery.contains('purposes', [purpose])
    }
    if (category) {
      countQuery = countQuery.contains('categories', [category])
    }
    if (location) {
      countQuery = countQuery.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }
    if (priceMin) {
      countQuery = countQuery.gte('price', priceMin)
    }
    if (priceMax) {
      countQuery = countQuery.lte('price', priceMax)
    }
    if (priceType) {
      countQuery = countQuery.eq('price_type', priceType)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({ 
      success: true,
      data: listings || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get user listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
