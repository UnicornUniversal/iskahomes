import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  cachePropertyCategories, 
  cachePropertyPurposes, 
  cachePropertyTypes, 
  cachePropertySubtypes,
  cacheAmenities,
  getCacheStats,
  CACHE_KEYS
} from '@/lib/cache'

// GET - Retrieve cached static data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const action = searchParams.get('action') || 'get'

    if (action === 'stats') {
      // Return cache statistics
      const stats = await getCacheStats()
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    // Import the appropriate getter function
    let getCachedData
    switch (type) {
      case 'categories':
        getCachedData = (await import('@/lib/cache')).getCachedPropertyCategories
        break
      case 'purposes':
        getCachedData = (await import('@/lib/cache')).getCachedPropertyPurposes
        break
      case 'types':
        getCachedData = (await import('@/lib/cache')).getCachedPropertyTypes
        break
      case 'subtypes':
        getCachedData = (await import('@/lib/cache')).getCachedPropertySubtypes
        break
      case 'amenities':
        getCachedData = (await import('@/lib/cache')).getCachedAmenities
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: categories, purposes, types, subtypes, amenities' },
          { status: 400 }
        )
    }

    const cachedData = await getCachedData()
    
    return NextResponse.json({
      success: true,
      data: cachedData,
      cached: cachedData !== null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting cached static data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get cached data',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// POST - Populate cache with fresh data from database
export async function POST(request) {
  try {
    const { type, force = false } = await request.json()

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    let data, cacheFunction, tableName

    // Determine which data to fetch and cache
    switch (type) {
      case 'categories':
        tableName = 'property_categories'
        cacheFunction = cachePropertyCategories
        break
      case 'purposes':
        tableName = 'property_purposes'
        cacheFunction = cachePropertyPurposes
        break
      case 'types':
        tableName = 'property_types'
        cacheFunction = cachePropertyTypes
        break
      case 'subtypes':
        tableName = 'property_subtypes'
        cacheFunction = cachePropertySubtypes
        break
      case 'amenities':
        tableName = 'amenities'
        cacheFunction = cacheAmenities
        break
      case 'all':
        // Cache all static data
        return await cacheAllStaticData()
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: categories, purposes, types, subtypes, amenities, all' },
          { status: 400 }
        )
    }

    // Fetch data from database
    const { data: dbData, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!dbData || dbData.length === 0) {
      return NextResponse.json(
        { error: `No active ${type} found in database` },
        { status: 404 }
      )
    }

    // Cache the data
    const cacheSuccess = await cacheFunction(dbData)

    if (!cacheSuccess) {
      throw new Error('Failed to cache data')
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cached ${dbData.length} ${type}`,
      data: {
        type,
        count: dbData.length,
        cached: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error caching static data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cache static data',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Cache all static data at once
async function cacheAllStaticData() {
  const results = {}
  const types = ['categories', 'purposes', 'types', 'subtypes', 'amenities']
  
  for (const type of types) {
    try {
      let tableName, cacheFunction
      
      switch (type) {
        case 'categories':
          tableName = 'property_categories'
          cacheFunction = cachePropertyCategories
          break
        case 'purposes':
          tableName = 'property_purposes'
          cacheFunction = cachePropertyPurposes
          break
        case 'types':
          tableName = 'property_types'
          cacheFunction = cachePropertyTypes
          break
        case 'subtypes':
          tableName = 'property_subtypes'
          cacheFunction = cachePropertySubtypes
          break
        case 'amenities':
          tableName = 'amenities'
          cacheFunction = cacheAmenities
          break
      }

      const { data: dbData, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        results[type] = { success: false, error: error.message }
        continue
      }

      const cacheSuccess = await cacheFunction(dbData)
      results[type] = {
        success: cacheSuccess,
        count: dbData?.length || 0,
        error: cacheSuccess ? null : 'Cache operation failed'
      }
    } catch (error) {
      results[type] = { success: false, error: error.message }
    }
  }

  const totalSuccess = Object.values(results).filter(r => r.success).length
  const totalCount = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)

  return NextResponse.json({
    success: totalSuccess > 0,
    message: `Cached ${totalSuccess}/${types.length} data types`,
    data: {
      results,
      summary: {
        totalTypes: types.length,
        successfulTypes: totalSuccess,
        totalRecords: totalCount,
        timestamp: new Date().toISOString()
      }
    }
  })
}
