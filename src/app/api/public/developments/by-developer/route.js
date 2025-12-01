import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Fetch developments with pagination
    const { data: developments, error } = await supabase
      .from('developments')
      .select(`
        id,
        slug,
        title,
        city,
        state,
        country,
        total_units,
        views,
        status,
        banner,
        development_status
      `)
      .eq('developer_id', developerId)
      .eq('development_status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching developments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch developments' },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .eq('development_status', 'active')

    return NextResponse.json({
      success: true,
      data: developments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Public developments by developer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

