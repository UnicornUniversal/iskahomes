import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { captureAuditEvent } from '@/lib/auditLogger'

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

    const draftCount = incompleteDrafts?.length || 0
    captureAuditEvent('listing_resume_checked', {
      user_id: userId,
      user_type: decoded.user_type || 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/listings/check-resume',
      metadata: {
        has_incomplete_drafts: draftCount > 0,
        draft_count: draftCount
      }
    }, userId)

    return NextResponse.json({
      success: true,
      hasIncompleteDrafts: incompleteDrafts && draftCount > 0,
      drafts: incompleteDrafts || [],
      count: draftCount
    })

  } catch (error) {
    console.error('Check resume error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

