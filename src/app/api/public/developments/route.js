import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const country = searchParams.get('country') || ''
    const purpose = searchParams.get('purpose') || ''
    const type = searchParams.get('type') || ''

    console.log('🔍 Public API - Fetching developments with filters:', {
      page, limit, search, status, city, country, purpose, type
    })

    let query = supabase
      .from('developments')
      .select('*')
      .eq('development_status', 'active')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply location filters
    if (city) {
      query = query.eq('city', city)
    }
    if (country) {
      query = query.eq('country', country)
    }

    // Apply purpose filter (if it's an array field)
    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    // Apply type filter (if it's an array field)
    if (type) {
      query = query.contains('types', [type])
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('development_status', 'active')

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: developments, error } = await query

    if (error) {
      console.error('❌ Error fetching developments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch developments' },
        { status: 500 }
      )
    }

    // Fetch developer information and resolve property types for each development
    const developmentsWithDevelopers = await Promise.all(
      (developments || []).map(async (development) => {
        // Fetch developer
        const { data: developer } = await supabase
          .from('developers')
          .select('id, name, slug, profile_image, verified')
          .eq('developer_id', development.developer_id)
          .single()

        // Fetch property types for purposes
        let purposesWithNames = []
        if (development.purposes && development.purposes.length > 0) {
          const { data: purposeTypes } = await supabase
            .from('property_purposes')
            .select('id, name')
            .in('id', development.purposes)
          purposesWithNames = purposeTypes || []
        }

        // Fetch property types for types
        let typesWithNames = []
        if (development.types && development.types.length > 0) {
          const { data: typeTypes } = await supabase
            .from('property_types')
            .select('id, name')
            .in('id', development.types)
          typesWithNames = typeTypes || []
        }

        // Fetch property types for categories
        let categoriesWithNames = []
        if (development.categories && development.categories.length > 0) {
          const { data: categoryTypes } = await supabase
            .from('property_categories')
            .select('id, name')
            .in('id', development.categories)
          categoriesWithNames = categoryTypes || []
        }

        return {
          ...development,
          developers: developer || null,
          purposes: purposesWithNames,
          types: typesWithNames,
          categories: categoriesWithNames
        }
      })
    )

    console.log('✅ Successfully fetched developments:', developmentsWithDevelopers?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        developments: developmentsWithDevelopers || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in developments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
