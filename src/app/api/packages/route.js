import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all active subscription packages (public endpoint)
// Optional query parameter: user_type (developers, agents, agencies)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('user_type')

    // Start building the query
    let query = supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('is_active', true)

    // Filter by user_type if provided
    if (userType) {
      const validUserTypes = ['developers', 'agents', 'agencies']
      const userTypeLower = userType.toLowerCase()
      if (validUserTypes.includes(userTypeLower)) {
        query = query.eq('user_type', userTypeLower)
      }
    }

    // Order and execute
    const { data: packages, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch packages', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: packages || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

