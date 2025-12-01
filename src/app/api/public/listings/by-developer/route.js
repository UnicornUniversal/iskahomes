import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Fetch listings with pagination
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', developerId)
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', developerId)
      .eq('listing_status', 'active')

    return NextResponse.json({
      success: true,
      data: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Public listings by developer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

