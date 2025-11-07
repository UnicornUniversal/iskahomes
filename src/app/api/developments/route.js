import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { cache } from 'react'
import { invalidateDevelopmentsCache } from '@/lib/cacheInvalidation'

// Cached function to fetch developments for a developer
const getCachedDevelopments = cache(async (developerId) => {
  const { data: developments, error } = await supabase
    .from('developments')
    .select('*')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch developments')
  }

  return developments
})

// GET - Fetch all developments for a developer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    
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
    
    console.log('GET Token verification debug:', {
      developerId_from_request: developerId,
      decoded_token: decoded ? {
        id: decoded.id,
        user_id: decoded.user_id,
        developer_id: decoded.developer_id,
        email: decoded.email,
        user_type: decoded.user_type
      } : null,
      comparison: decoded ? {
        'decoded.developer_id': decoded.developer_id,
        'developerId_from_request': developerId,
        'types_match': typeof decoded.developer_id === typeof developerId,
        'values_match': decoded.developer_id === developerId
      } : null
    });
    
    if (!decoded || decoded.developer_id !== developerId) {
      console.log('GET Token verification failed:', {
        decoded_exists: !!decoded,
        developer_id_match: decoded ? decoded.developer_id === developerId : false
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Use cached function to fetch developments
    const developments = await getCachedDevelopments(developerId)
    return NextResponse.json({ data: developments })

  } catch (error) {
    console.error('Get developments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new development
export async function POST(request) {
  try {
    const body = await request.json()
    const { developer_id, ...developmentData } = body

    if (!developer_id) {
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
    
    console.log('Token verification debug:', {
      developer_id_from_request: developer_id,
      decoded_token: decoded ? {
        id: decoded.id,
        user_id: decoded.user_id,
        developer_id: decoded.developer_id,
        email: decoded.email,
        user_type: decoded.user_type
      } : null,
      comparison: decoded ? {
        'decoded.developer_id': decoded.developer_id,
        'developer_id_from_request': developer_id,
        'types_match': typeof decoded.developer_id === typeof developer_id,
        'values_match': decoded.developer_id === developer_id
      } : null
    });
    
    if (!decoded || decoded.developer_id !== developer_id) {
      console.log('Token verification failed:', {
        decoded_exists: !!decoded,
        developer_id_match: decoded ? decoded.developer_id === developer_id : false
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Debug: Log the data being sent
    console.log('Development data being sent:', JSON.stringify(developmentData, null, 2));
    
    // Create the development
    const { data: development, error } = await supabase
      .from('developments')
      .insert([{
        developer_id,
        ...developmentData
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating development:', error)
      return NextResponse.json(
        { error: 'Failed to create development' },
        { status: 500 }
      )
    }

    // Invalidate cache after successful creation
    invalidateDevelopmentsCache(developer_id)

    return NextResponse.json({ 
      success: true, 
      data: development,
      message: 'Development created successfully' 
    })

  } catch (error) {
    console.error('Create development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
