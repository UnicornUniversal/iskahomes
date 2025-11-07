import { NextResponse } from 'next/server'
import {
  getCachedPropertyCategories,
  getCachedPropertyPurposes,
  getCachedPropertyTypes,
  getCachedPropertySubtypes,
  getCachedPropertyStatuses,
  getCachedAmenities
} from '@/lib/cache'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to remove total_properties from data
function removeTotalProperties(data) {
  if (!Array.isArray(data)) return data
  return data.map(item => {
    const { total_properties, ...rest } = item
    return rest
  })
}

// GET - Fetch all cached category data (for frontend use)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // Optional: 'all', 'purposes', 'types', etc.

    // If specific type requested, return only that
    if (type && type !== 'all') {
      let data = null
      
      switch (type) {
        case 'purposes':
          data = await getCachedPropertyPurposes()
          if (!data) {
            // Fallback to DB if Redis miss
            const { data: dbData } = await supabaseAdmin
              .from('property_purposes')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        case 'types':
          data = await getCachedPropertyTypes()
          if (!data) {
            const { data: dbData } = await supabaseAdmin
              .from('property_types')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        case 'categories':
          data = await getCachedPropertyCategories()
          if (!data) {
            const { data: dbData } = await supabaseAdmin
              .from('property_categories')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        case 'subtypes':
          data = await getCachedPropertySubtypes()
          if (!data) {
            const { data: dbData } = await supabaseAdmin
              .from('property_subtypes')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        case 'statuses':
          data = await getCachedPropertyStatuses()
          if (!data) {
            const { data: dbData } = await supabaseAdmin
              .from('property_status')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        case 'amenities':
          data = await getCachedAmenities()
          if (!data) {
            const { data: dbData } = await supabaseAdmin
              .from('property_amenities')
              .select('*')
              .order('name', { ascending: true })
            data = dbData || []
          }
          return NextResponse.json({ data: removeTotalProperties(data || []) })
        
        default:
          return NextResponse.json(
            { error: 'Invalid type. Use: purposes, types, categories, subtypes, statuses, amenities, or all' },
            { status: 400 }
          )
      }
    }

    // Fetch all data from Redis (parallel)
    const [
      purposes,
      types,
      categories,
      subtypes,
      statuses,
      amenities
    ] = await Promise.all([
      getCachedPropertyPurposes(),
      getCachedPropertyTypes(),
      getCachedPropertyCategories(),
      getCachedPropertySubtypes(),
      getCachedPropertyStatuses(),
      getCachedAmenities()
    ])

    // If any Redis cache misses, fetch from DB as fallback
    const fetchFallback = async (cacheData, tableName) => {
      if (cacheData) return cacheData
      const { data } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .order('name', { ascending: true })
      return data || []
    }

    const [
      purposesData,
      typesData,
      categoriesData,
      subtypesData,
      statusesData,
      amenitiesData
    ] = await Promise.all([
      fetchFallback(purposes, 'property_purposes'),
      fetchFallback(types, 'property_types'),
      fetchFallback(categories, 'property_categories'),
      fetchFallback(subtypes, 'property_subtypes'),
      fetchFallback(statuses, 'property_status'),
      fetchFallback(amenities, 'property_amenities')
    ])

    return NextResponse.json({
      data: {
        purposes: removeTotalProperties(purposesData || []),
        types: removeTotalProperties(typesData || []),
        categories: removeTotalProperties(categoriesData || []),
        subtypes: removeTotalProperties(subtypesData || []),
        statuses: removeTotalProperties(statusesData || []),
        amenities: removeTotalProperties(amenitiesData || [])
      }
    })
  } catch (error) {
    console.error('Error fetching cached data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cached data', details: error.message },
      { status: 500 }
    )
  }
}

