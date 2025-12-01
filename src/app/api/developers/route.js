import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const featured = searchParams.get('featured') === 'true'
    const offset = (page - 1) * limit

    // Build query for developers only
    // Only show developers with active or approved account status
    // Only fetch necessary fields for the card display
    let query = supabase
      .from('developers')
      .select(`
        name,
        slug,
        cover_image,
        profile_image,
        company_locations,
        city,
        region,
        country,
        total_units,
        total_developments,
        account_status
      `)
      .in('account_status', ['active', 'approved'])
      .order('created_at', { ascending: false })

    // For featured developers, only get those with cover images
    if (featured) {
      query = query.not('cover_image', 'is', null)
    }

    // Apply search filter if provided (name search)
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Apply location filter if provided (searches city, region, country, and company_locations)
    if (location) {
      query = query.or(`city.ilike.%${location}%,region.ilike.%${location}%,country.ilike.%${location}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: developers, error } = await query

    if (error) {
      console.error('Error fetching developers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch developers' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('developers')
      .select('*', { count: 'exact', head: true })
      .in('account_status', ['active', 'approved'])

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`)
    }

    if (location) {
      countQuery = countQuery.or(`city.ilike.%${location}%,region.ilike.%${location}%,country.ilike.%${location}%`)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      success: true,
      data: developers || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get developers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
