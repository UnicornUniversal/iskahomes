import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

/**
 * GET /api/listings/check-resume
 * Check if user has any incomplete drafts to resume
 */
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

    // Find incomplete drafts
    const { data: incompleteDrafts, error } = await supabase
      .from('listings')
      .select('id, title, created_at, listing_condition, upload_status, listing_status')
      .eq('user_id', userId)
      .eq('listing_status', 'draft')
      .in('listing_condition', ['adding', 'updating'])
      .eq('upload_status', 'incomplete')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error checking for incomplete drafts:', error)
      return NextResponse.json(
        { error: 'Failed to check for incomplete drafts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hasIncompleteDrafts: incompleteDrafts && incompleteDrafts.length > 0,
      drafts: incompleteDrafts || [],
      count: incompleteDrafts?.length || 0
    })

  } catch (error) {
    console.error('Check resume error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

