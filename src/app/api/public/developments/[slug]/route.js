import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug } = params
    console.log('🔍 Public API - Fetching development with slug:', slug)

    if (!slug) {
      console.log('❌ No slug provided')
      return NextResponse.json(
        { error: 'Development slug is required' },
        { status: 400 }
      )
    }

    // Fetch development details
    const { data: development, error: developmentError } = await supabase
      .from('developments')
      .select('*')
      .eq('slug', slug)
      .eq('development_status', 'active')
      .single()

    if (developmentError) {
      console.error('❌ Error fetching development:', developmentError)
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    // Fetch developer information
    const { data: developer, error: developerError } = await supabase
      .from('developers')
      .select(`
        id,
        name,
        slug,
        email,
        phone,
        secondary_email,
        secondary_phone,
        tertiary_email,
        tertiary_phone,
        website,
        city,
        country,
        profile_image,
        cover_image,
        description,
        verified,
        social_media,
        customer_care
      `)
      .eq('developer_id', development.developer_id)
      .single()

    if (developerError) {
      console.error('❌ Error fetching developer:', developerError)
    }

    // Resolve property types for the development
    let purposesWithNames = []
    if (development.purposes && development.purposes.length > 0) {
      const { data: purposeTypes } = await supabase
        .from('property_purposes')
        .select('id, name')
        .in('id', development.purposes)
      purposesWithNames = purposeTypes || []
    }

    let typesWithNames = []
    if (development.types && development.types.length > 0) {
      const { data: typeTypes } = await supabase
        .from('property_types')
        .select('id, name')
        .in('id', development.types)
      typesWithNames = typeTypes || []
    }

    let categoriesWithNames = []
    if (development.categories && development.categories.length > 0) {
      const { data: categoryTypes } = await supabase
        .from('property_categories')
        .select('id, name')
        .in('id', development.categories)
      categoriesWithNames = categoryTypes || []
    }

    // Resolve unit types
    let unitTypesWithNames = []
    if (development.unit_types?.database && development.unit_types.database.length > 0) {
      const { data: unitTypeData } = await supabase
        .from('unit_types')
        .select('id, name, description')
        .in('id', development.unit_types.database.map(ut => ut.id))
      unitTypesWithNames = unitTypeData || []
    }

    // Fetch units/listings for this development
    const { data: units, error: unitsError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        size,
        status,
        price,
        currency,
        duration,
        price_type,
        specifications,
        amenities,
        media,
        slug,
        created_at,
        is_featured,
        is_verified,
        is_premium,
        available_from,
        listing_type,
        user_id,
        account_type
      `)
      .eq('development_id', development.id)
      .eq('account_type', 'developer')
      .eq('user_id', development.developer_id)
      .order('created_at', { ascending: false })

    if (unitsError) {
      console.error('❌ Error fetching units:', unitsError)
    }

    console.log('🔍 Units query details:', {
      development_id: development.id,
      developer_id: development.developer_id,
      units_found: units?.length || 0,
      units: units?.map(u => ({ id: u.id, title: u.title, user_id: u.user_id, account_type: u.account_type }))
    })

    // Fetch other developments by the same developer
    const { data: relatedDevelopments, error: relatedError } = await supabase
      .from('developments')
      .select(`
        id,
        title,
        description,
        status,
        city,
        country,
        banner,
        slug,
        number_of_buildings,
        total_units,
        purposes,
        types,
        categories
      `)
      .eq('developer_id', development.developer_id)
      .eq('development_status', 'active')
      .neq('id', development.id)
      .order('created_at', { ascending: false })
      .limit(6)

    if (relatedError) {
      console.error('❌ Error fetching related developments:', relatedError)
    }

    // Resolve property types for related developments
    const relatedWithResolvedTypes = await Promise.all(
      (relatedDevelopments || []).map(async (related) => {
        // Fetch property types for purposes
        let relatedPurposesWithNames = []
        if (related.purposes && related.purposes.length > 0) {
          const { data: purposeTypes } = await supabase
            .from('property_purposes')
            .select('id, name')
            .in('id', related.purposes)
          relatedPurposesWithNames = purposeTypes || []
        }

        // Fetch property types for types
        let relatedTypesWithNames = []
        if (related.types && related.types.length > 0) {
          const { data: typeTypes } = await supabase
            .from('property_types')
            .select('id, name')
            .in('id', related.types)
          relatedTypesWithNames = typeTypes || []
        }

        // Fetch property types for categories
        let relatedCategoriesWithNames = []
        if (related.categories && related.categories.length > 0) {
          const { data: categoryTypes } = await supabase
            .from('property_categories')
            .select('id, name')
            .in('id', related.categories)
          relatedCategoriesWithNames = categoryTypes || []
        }

        return {
          ...related,
          purposes: relatedPurposesWithNames,
          types: relatedTypesWithNames,
          categories: relatedCategoriesWithNames
        }
      })
    )

    console.log('✅ Successfully fetched development:', {
      development: development?.title,
      developer: developer?.name,
      units: units?.length || 0,
      related: relatedDevelopments?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: {
        development: {
          ...development,
          developers: developer || null,
          purposes: purposesWithNames,
          types: typesWithNames,
          categories: categoriesWithNames,
          unit_types: {
            ...development.unit_types,
            database: unitTypesWithNames
          }
        },
        units: units || [],
        relatedDevelopments: relatedWithResolvedTypes || []
      }
    })

  } catch (error) {
    console.error('❌ Error in development API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
