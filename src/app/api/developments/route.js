import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { cache } from 'react'
import { invalidateDevelopmentsCache } from '@/lib/cacheInvalidation'

// Helper function to update developer's total_developments count
async function updateDeveloperTotalDevelopments(developerIdFromRequest) {
  try {
    // Get developer record by developer_id (which matches the developer_id in developments table)
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id')
      .eq('developer_id', developerIdFromRequest)
      .single()

    if (devError || !developer) {
      console.error('Error fetching developer for total_developments update:', devError)
      return
    }

    // Count developments where developer_id matches the developer_id from request
    // Note: developments.developer_id stores developers.developer_id (not developers.id)
    const { count: totalDevelopmentsCount, error: countError } = await supabaseAdmin
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerIdFromRequest)

    if (countError) {
      console.error('Error counting developments:', countError)
      return
    }

    // Update developer's total_developments
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({ total_developments: totalDevelopmentsCount || 0 })
      .eq('id', developer.id)

    if (updateError) {
      console.error('Error updating developer total_developments:', updateError)
    } else {
      console.log('✅ Developer total_developments updated:', {
        developer_id: developerIdFromRequest,
        total_developments: totalDevelopmentsCount || 0
      })
    }
  } catch (error) {
    console.error('Error in updateDeveloperTotalDevelopments:', error)
  }
}

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

// GET - Fetch all developments for a developer (with optional filtering)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')
    
    // Filter parameters
    const search = searchParams.get('search')
    const locationType = searchParams.get('location_type')
    const locationValue = searchParams.get('location_value')
    const purpose = searchParams.get('purpose')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const subType = searchParams.get('sub_type')
    
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

    // Build query with filters
    let query = supabase
      .from('developments')
      .select('*')
      .eq('developer_id', developerId)

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`)
    }

    // Apply location filter
    if (locationType && locationValue) {
      switch (locationType) {
        case 'country':
          query = query.eq('country', locationValue)
          break
        case 'state':
          query = query.eq('state', locationValue)
          break
        case 'city':
          query = query.eq('city', locationValue)
          break
        case 'town':
          query = query.eq('town', locationValue)
          break
      }
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false })

    const { data: developments, error } = await query

    if (error) {
      console.error('Error fetching developments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch developments' },
        { status: 500 }
      )
    }

    // Filter by category IDs (stored as JSON arrays)
    let filtered = developments || []
    
    if (purpose) {
      filtered = filtered.filter(dev => {
        try {
          const purposes = typeof dev.purposes === 'string' 
            ? JSON.parse(dev.purposes) 
            : dev.purposes || []
          return Array.isArray(purposes) && purposes.includes(purpose)
        } catch (e) {
          return false
        }
      })
    }
    
    if (type) {
      filtered = filtered.filter(dev => {
        try {
          const types = typeof dev.types === 'string' 
            ? JSON.parse(dev.types) 
            : dev.types || []
          return Array.isArray(types) && types.includes(type)
        } catch (e) {
          return false
        }
      })
    }
    
    if (category) {
      filtered = filtered.filter(dev => {
        try {
          const categories = typeof dev.categories === 'string' 
            ? JSON.parse(dev.categories) 
            : dev.categories || []
          return Array.isArray(categories) && categories.includes(category)
        } catch (e) {
          return false
        }
      })
    }
    
    if (subType) {
      filtered = filtered.filter(dev => {
        try {
          // Subtypes are stored in unit_types.database array
          const unitTypes = typeof dev.unit_types === 'string' 
            ? JSON.parse(dev.unit_types) 
            : dev.unit_types || {}
          const databaseSubtypes = unitTypes.database || []
          return databaseSubtypes.some(st => st.id === subType)
        } catch (e) {
          return false
        }
      })
    }

    return NextResponse.json({ data: filtered })

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

    // Update developer's total_developments count
    await updateDeveloperTotalDevelopments(developer_id)

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
