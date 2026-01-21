import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
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

    // Count active developments (not deleted) where developer_id matches
    // Note: developments.developer_id stores developers.developer_id (not developers.id)
    const { count: totalDevelopmentsCount, error: countError } = await supabaseAdmin
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerIdFromRequest)
      .neq('development_status', 'deleted')

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
    .neq('development_status', 'deleted')
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

    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Get the actual developer's user_id from organization
    // For team members, get developer_id from developers table; for developers, use their user_id
    let actualDeveloperId = developerId
    
    if (userInfo.user_type === 'team_member') {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('id', userInfo.organization_id)
        .single()
      
      if (!developer?.developer_id) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
      }
      
      actualDeveloperId = developer.developer_id
    } else {
      // For developers, developerId should match their user_id
      if (developerId !== userInfo.user_id) {
        return NextResponse.json({ error: 'Invalid developer ID' }, { status: 403 })
      }
      actualDeveloperId = developerId
    }

    // Build query with filters
    // Exclude deleted developments (only show active ones)
    let query = supabase
      .from('developments')
      .select('*')
      .eq('developer_id', actualDeveloperId)
      .neq('development_status', 'deleted')

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

    // Ensure total_units is always present (default to 0 if null/undefined)
    // Filter by category IDs (stored as JSON arrays)
    let filtered = (developments || []).map(dev => ({
      ...dev,
      total_units: dev.total_units !== null && dev.total_units !== undefined ? dev.total_units : 0
    }))
    
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

    // Authenticate request (handles both developers and team members)
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    // Must be developer organization
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    // Get the actual developer's user_id from organization
    // For team members, get developer_id from developers table; for developers, use their user_id
    let actualDeveloperId = developer_id
    
    if (userInfo.user_type === 'team_member') {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('id', userInfo.organization_id)
        .single()
      
      if (!developer?.developer_id) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
      }
      
      actualDeveloperId = developer.developer_id
    } else {
      // For developers, developer_id should match their user_id
      if (developer_id !== userInfo.user_id) {
        return NextResponse.json({ error: 'Invalid developer ID' }, { status: 403 })
      }
      actualDeveloperId = developer_id
    }

    // Debug: Log the data being sent
    console.log('Development data being sent:', JSON.stringify(developmentData, null, 2));
    
    // Create the development
    const { data: development, error } = await supabase
      .from('developments')
      .insert([{
        developer_id: actualDeveloperId,
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
    invalidateDevelopmentsCache(actualDeveloperId)

    // Update developer's total_developments count
    await updateDeveloperTotalDevelopments(actualDeveloperId)

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
