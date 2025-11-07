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

    const userId = decoded.user_id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    // Build query for units belonging to this developer
    let query = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId) // Filter by developer's user_id
      .eq('listing_type', 'unit') // Only units
      .order('created_at', { ascending: false })

    // Apply additional filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('listing_status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: units, error } = await query

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json(
        { error: 'Failed to fetch units' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('listing_type', 'unit')

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (status) {
      countQuery = countQuery.eq('listing_status', status)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({ 
      success: true,
      data: units || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get units error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}