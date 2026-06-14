import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  APPROVED_ADMIN_STATUS,
  applyPublicDevelopmentFilters,
  getApprovedDeveloperIds
} from '@/lib/publicDevelopmentsHelper'

const parseArrayField = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const location = searchParams.get('location') || ''
    const locationType = searchParams.get('location_type') || ''
    const developerId = searchParams.get('developer_id') || ''
    const developerName = searchParams.get('developer_name') || ''
    const selectedTypes = (searchParams.get('type') || searchParams.get('types') || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
    const selectedSubtypes = (searchParams.get('subtype') || searchParams.get('subtypes') || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)

    console.log('🔍 Public API - Fetching developments with filters:', {
      page, limit, search, status, location, locationType, developerId, developerName, selectedTypes, selectedSubtypes
    })

    const approvedDeveloperIds = await getApprovedDeveloperIds()

    if (approvedDeveloperIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          developments: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      })
    }

    let matchedDeveloperIds = []

    if (developerName && !developerId) {
      const { data: matchingDevelopers, error: developerMatchError } = await supabase
        .from('developers')
        .select('developer_id')
        .ilike('name', `%${developerName}%`)
        .eq('admin_status', APPROVED_ADMIN_STATUS)

      if (developerMatchError) {
        console.error('❌ Error matching developers by name:', developerMatchError)
        return NextResponse.json(
          { error: 'Failed to match developer filter' },
          { status: 500 }
        )
      }

      matchedDeveloperIds = (matchingDevelopers || [])
        .map(developer => developer.developer_id)
        .filter(Boolean)

      if (matchedDeveloperIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            developments: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0
            }
          }
        })
      }
    }

    const applyFilters = (query) => {
      let nextQuery = query

      if (search) {
        nextQuery = nextQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,country.ilike.%${search}%,full_address.ilike.%${search}%`)
      }

      if (status) {
        nextQuery = nextQuery.eq('status', status)
      }

      if (location) {
        if (['country', 'state', 'city', 'town'].includes(locationType)) {
          nextQuery = nextQuery.ilike(locationType, `%${location}%`)
        } else {
          nextQuery = nextQuery.or(
            `country.ilike.%${location}%,state.ilike.%${location}%,city.ilike.%${location}%,town.ilike.%${location}%,full_address.ilike.%${location}%`
          )
        }
      }

      if (developerId) {
        nextQuery = nextQuery.eq('developer_id', developerId)
      } else if (matchedDeveloperIds.length > 0) {
        nextQuery = nextQuery.in('developer_id', matchedDeveloperIds)
      }

      if (selectedTypes.length === 1) {
        nextQuery = nextQuery.filter('types', 'cs', JSON.stringify([selectedTypes[0]]))
      } else if (selectedTypes.length > 1) {
        nextQuery = nextQuery.or(
          selectedTypes
            .map(typeId => `types.cs.${JSON.stringify([typeId])}`)
            .join(',')
        )
      }

      if (selectedSubtypes.length === 1) {
        nextQuery = nextQuery.filter('unit_types->database', 'cs', JSON.stringify([{ id: selectedSubtypes[0] }]))
      }

      return nextQuery
    }

    let query = applyPublicDevelopmentFilters(
      applyFilters(
        supabase
          .from('developments')
          .select('*')
          .order('created_at', { ascending: false })
      ),
      approvedDeveloperIds
    )

    // Get total count for pagination
    const countQuery = applyPublicDevelopmentFilters(
      applyFilters(
        supabase
          .from('developments')
          .select('*', { count: 'exact', head: true })
      ),
      approvedDeveloperIds
    )

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error counting developments:', countError)
      return NextResponse.json(
        { error: 'Failed to count developments' },
        { status: 500 }
      )
    }

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
    const normalizedDevelopments = (developments || []).map(development => ({
      ...development,
      purposes: parseArrayField(development.purposes),
      types: parseArrayField(development.types),
      categories: parseArrayField(development.categories)
    }))

    const developerIds = [...new Set(normalizedDevelopments.map(item => item.developer_id).filter(Boolean))]
    const purposeIds = [...new Set(normalizedDevelopments.flatMap(item => item.purposes))]
    const typeIds = [...new Set(normalizedDevelopments.flatMap(item => item.types))]
    const categoryIds = [...new Set(normalizedDevelopments.flatMap(item => item.categories))]

    const [
      developersResult,
      purposesResult,
      typesResult,
      categoriesResult
    ] = await Promise.all([
      developerIds.length > 0
        ? supabase
            .from('developers')
            .select('id, developer_id, name, slug, profile_image, verified')
            .in('developer_id', developerIds)
            .eq('admin_status', APPROVED_ADMIN_STATUS)
        : Promise.resolve({ data: [], error: null }),
      purposeIds.length > 0
        ? supabase.from('property_purposes').select('id, name').in('id', purposeIds)
        : Promise.resolve({ data: [], error: null }),
      typeIds.length > 0
        ? supabase.from('property_types').select('id, name').in('id', typeIds)
        : Promise.resolve({ data: [], error: null }),
      categoryIds.length > 0
        ? supabase.from('property_categories').select('id, name').in('id', categoryIds)
        : Promise.resolve({ data: [], error: null })
    ])

    const developerMap = new Map((developersResult.data || []).map(item => [item.developer_id, item]))
    const purposeMap = new Map((purposesResult.data || []).map(item => [item.id, item]))
    const typeMap = new Map((typesResult.data || []).map(item => [item.id, item]))
    const categoryMap = new Map((categoriesResult.data || []).map(item => [item.id, item]))

    const developmentsWithDevelopers = normalizedDevelopments.map(development => ({
      ...development,
      developers: developerMap.get(development.developer_id) || null,
      purposes: development.purposes.map(id => purposeMap.get(id)).filter(Boolean),
      types: development.types.map(id => typeMap.get(id)).filter(Boolean),
      categories: development.categories.map(id => categoryMap.get(id)).filter(Boolean)
    }))

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
