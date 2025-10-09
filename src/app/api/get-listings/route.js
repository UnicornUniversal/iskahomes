import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    console.log('Fetching all listings from /api/get-listings...')
    
    // Just get ALL listings - no filters, no joins, no complications
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Listings fetched:', listings?.length || 0)

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: listings || [],
      total: listings?.length || 0
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
