import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Search developments for a developer by name
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    const searchQuery = searchParams.get('query') || ''
    
    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.developer_id !== developerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('developments')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })

    // Add search filter if query is provided
    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`)
    }

    // Limit to first 5 if no search query (for initial display)
    if (!searchQuery.trim()) {
      query = query.limit(5)
    }

    const { data: developments, error } = await query

    if (error) {
      console.error('Error searching developments:', error)
      return NextResponse.json(
        { error: 'Failed to search developments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      data: developments || []
    })

  } catch (error) {
    console.error('Search developments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

