import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const country = searchParams.get('country') || ''

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('agencies')
      .select(`
        id,
        agency_id,
        name,
        email,
        phone,
        website,
        address,
        city,
        region,
        state,
        country,
        description,
        profile_image,
        cover_image,
        social_media,
        slug,
        verified,
        account_status,
        total_listings,
        total_agents,
        company_size,
        founded_year,
        license_number,
        created_at
      `)
      .eq('account_status', 'active')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`)
    }

    // Apply location filters
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    if (country) {
      query = query.ilike('country', `%${country}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: agencies, error } = await query

    if (error) {
      console.error('Error fetching agencies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agencies', details: error.message },
        { status: 500 }
      )
    }

    // Get total count
    let countQuery = supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'active')

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`)
    }

    if (city) {
      countQuery = countQuery.ilike('city', `%${city}%`)
    }

    if (country) {
      countQuery = countQuery.ilike('country', `%${country}%`)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: agencies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Public agencies fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

