import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developer_id')

    // If developer_id is provided, fetch all developments for that developer
    if (developerId) {
      const { data: developments, error: devError } = await supabase
        .from('developments')
        .select('*')
        .eq('developer_id', developerId)
        .eq('development_status', 'active')

      if (devError) {
        return NextResponse.json(
          { error: 'Failed to fetch developments', details: devError?.message },
          { status: 500 }
        )
      }

      if (!developments || developments.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            development: {
              total_units: 0,
              units_sold: 0,
              units_left: 0
            },
            stats: {
              purposes: [],
              categories: [],
              types: [],
              subtypes: [],
              unitTypes: []
            }
          }
        })
      }

      // Aggregate stats across all developments
      const parseStats = (jsonString) => {
        if (!jsonString) return []
        try {
          return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString
        } catch {
          return []
        }
      }

      // Aggregate all stats
      const aggregatedPurposes = {}
      const aggregatedCategories = {}
      const aggregatedTypes = {}
      const aggregatedSubtypes = {}
      let totalUnits = 0
      let totalUnitsSold = 0
      let totalUnitsLeft = 0

      developments.forEach(dev => {
        totalUnits += dev.total_units || 0
        totalUnitsSold += dev.units_sold || 0
        totalUnitsLeft += dev.units_left || 0

        const purposesStats = parseStats(dev.property_purposes_stats)
        const categoriesStats = parseStats(dev.property_categories_stats)
        const typesStats = parseStats(dev.property_types_stats)
        const subtypesStats = parseStats(dev.property_subtypes_stats)

        purposesStats.forEach(stat => {
          if (!aggregatedPurposes[stat.category_id]) {
            aggregatedPurposes[stat.category_id] = { category_id: stat.category_id, total_amount: 0 }
          }
          aggregatedPurposes[stat.category_id].total_amount += stat.total_amount || 0
        })

        categoriesStats.forEach(stat => {
          if (!aggregatedCategories[stat.category_id]) {
            aggregatedCategories[stat.category_id] = { category_id: stat.category_id, total_amount: 0 }
          }
          aggregatedCategories[stat.category_id].total_amount += stat.total_amount || 0
        })

        typesStats.forEach(stat => {
          if (!aggregatedTypes[stat.category_id]) {
            aggregatedTypes[stat.category_id] = { category_id: stat.category_id, total_amount: 0 }
          }
          aggregatedTypes[stat.category_id].total_amount += stat.total_amount || 0
        })

        subtypesStats.forEach(stat => {
          if (!aggregatedSubtypes[stat.category_id]) {
            aggregatedSubtypes[stat.category_id] = { category_id: stat.category_id, total_amount: 0 }
          }
          aggregatedSubtypes[stat.category_id].total_amount += stat.total_amount || 0
        })
      })

      // Convert to arrays and calculate percentages
      const purposesStats = Object.values(aggregatedPurposes)
      const categoriesStats = Object.values(aggregatedCategories)
      const typesStats = Object.values(aggregatedTypes)
      const subtypesStats = Object.values(aggregatedSubtypes)

      const calculatePercentage = (stats) => {
        const total = stats.reduce((sum, s) => sum + (s.total_amount || 0), 0)
        return stats.map(stat => ({
          ...stat,
          percentage: total > 0 ? ((stat.total_amount || 0) / total * 100).toFixed(2) : 0
        }))
      }

      const purposesWithPercentage = calculatePercentage(purposesStats)
      const categoriesWithPercentage = calculatePercentage(categoriesStats)
      const typesWithPercentage = calculatePercentage(typesStats)
      const subtypesWithPercentage = calculatePercentage(subtypesStats)

      // Collect all category IDs
      const purposeIds = purposesWithPercentage.map(s => s.category_id).filter(Boolean)
      const categoryIds = categoriesWithPercentage.map(s => s.category_id).filter(Boolean)
      const typeIds = typesWithPercentage.map(s => s.category_id).filter(Boolean)
      const subtypeIds = subtypesWithPercentage.map(s => s.category_id).filter(Boolean)

      // Fetch category names in parallel
      const [purposesRes, categoriesRes, typesRes, subtypesRes] = await Promise.all([
        purposeIds.length > 0
          ? supabase.from('property_purposes').select('id, name').in('id', purposeIds)
          : Promise.resolve({ data: [] }),
        categoryIds.length > 0
          ? supabase.from('property_categories').select('id, name').in('id', categoryIds)
          : Promise.resolve({ data: [] }),
        typeIds.length > 0
          ? supabase.from('property_types').select('id, name').in('id', typeIds)
          : Promise.resolve({ data: [] }),
        subtypeIds.length > 0
          ? supabase.from('property_subtypes').select('id, name').in('id', subtypeIds)
          : Promise.resolve({ data: [] })
      ])

      // Create lookup maps
      const purposeMap = (purposesRes.data || []).reduce((acc, p) => {
        acc[p.id] = p.name
        return acc
      }, {})

      const categoryMap = (categoriesRes.data || []).reduce((acc, c) => {
        acc[c.id] = c.name
        return acc
      }, {})

      const typeMap = (typesRes.data || []).reduce((acc, t) => {
        acc[t.id] = t.name
        return acc
      }, {})

      const subtypeMap = (subtypesRes.data || []).reduce((acc, s) => {
        acc[s.id] = s.name
        return acc
      }, {})

      // Enrich stats with names
      const enrichedPurposes = purposesWithPercentage.map(stat => ({
        ...stat,
        name: purposeMap[stat.category_id] || 'Unknown Purpose',
        label: purposeMap[stat.category_id] || 'Unknown Purpose'
      }))

      const enrichedCategories = categoriesWithPercentage.map(stat => ({
        ...stat,
        name: categoryMap[stat.category_id] || 'Unknown Category',
        label: categoryMap[stat.category_id] || 'Unknown Category'
      }))

      const enrichedTypes = typesWithPercentage.map(stat => ({
        ...stat,
        name: typeMap[stat.category_id] || 'Unknown Type',
        label: typeMap[stat.category_id] || 'Unknown Type'
      }))

      const enrichedSubtypes = subtypesWithPercentage.map(stat => ({
        ...stat,
        name: subtypeMap[stat.category_id] || 'Unknown Subtype',
        label: subtypeMap[stat.category_id] || 'Unknown Subtype'
      }))

      return NextResponse.json({
        success: true,
        data: {
          development: {
            total_units: totalUnits,
            units_sold: totalUnitsSold,
            units_left: totalUnitsLeft
          },
          stats: {
            purposes: enrichedPurposes,
            categories: enrichedCategories,
            types: enrichedTypes,
            subtypes: enrichedSubtypes,
            unitTypes: []
          }
        }
      })
    }

    // Original logic for single development by ID
    if (!id) {
      return NextResponse.json(
        { error: 'Development ID or developer_id is required' },
        { status: 400 }
      )
    }

    // Fetch development
    const { data: development, error: devError } = await supabase
      .from('developments')
      .select('*')
      .eq('id', id)
      .single()

    if (devError || !development) {
      return NextResponse.json(
        { error: 'Development not found', details: devError?.message },
        { status: 404 }
      )
    }

    // Parse stats JSON strings
    const parseStats = (jsonString) => {
      if (!jsonString) return []
      try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString
      } catch {
        return []
      }
    }

    const purposesStats = parseStats(development.property_purposes_stats)
    const categoriesStats = parseStats(development.property_categories_stats)
    const typesStats = parseStats(development.property_types_stats)
    const subtypesStats = parseStats(development.property_subtypes_stats)

    // Collect all category IDs
    const purposeIds = purposesStats.map(s => s.category_id).filter(Boolean)
    const categoryIds = categoriesStats.map(s => s.category_id).filter(Boolean)
    const typeIds = typesStats.map(s => s.category_id).filter(Boolean)
    const subtypeIds = subtypesStats.map(s => s.category_id).filter(Boolean)

    // Fetch category names in parallel
    const [purposesRes, categoriesRes, typesRes, subtypesRes] = await Promise.all([
      purposeIds.length > 0
        ? supabase.from('property_purposes').select('id, name').in('id', purposeIds)
        : Promise.resolve({ data: [] }),
      categoryIds.length > 0
        ? supabase.from('property_categories').select('id, name').in('id', categoryIds)
        : Promise.resolve({ data: [] }),
      typeIds.length > 0
        ? supabase.from('property_types').select('id, name').in('id', typeIds)
        : Promise.resolve({ data: [] }),
      subtypeIds.length > 0
        ? supabase.from('property_subtypes').select('id, name').in('id', subtypeIds)
        : Promise.resolve({ data: [] })
    ])

    // Create lookup maps
    const purposeMap = (purposesRes.data || []).reduce((acc, p) => {
      acc[p.id] = p.name
      return acc
    }, {})

    const categoryMap = (categoriesRes.data || []).reduce((acc, c) => {
      acc[c.id] = c.name
      return acc
    }, {})

    const typeMap = (typesRes.data || []).reduce((acc, t) => {
      acc[t.id] = t.name
      return acc
    }, {})

    const subtypeMap = (subtypesRes.data || []).reduce((acc, s) => {
      acc[s.id] = s.name
      return acc
    }, {})

    // Enrich stats with names
    const enrichedPurposes = purposesStats.map(stat => ({
      ...stat,
      name: purposeMap[stat.category_id] || 'Unknown Purpose',
      label: purposeMap[stat.category_id] || 'Unknown Purpose'
    }))

    const enrichedCategories = categoriesStats.map(stat => ({
      ...stat,
      name: categoryMap[stat.category_id] || 'Unknown Category',
      label: categoryMap[stat.category_id] || 'Unknown Category'
    }))

    const enrichedTypes = typesStats.map(stat => ({
      ...stat,
      name: typeMap[stat.category_id] || 'Unknown Type',
      label: typeMap[stat.category_id] || 'Unknown Type'
    }))

    const enrichedSubtypes = subtypesStats.map(stat => ({
      ...stat,
      name: subtypeMap[stat.category_id] || 'Unknown Subtype',
      label: subtypeMap[stat.category_id] || 'Unknown Subtype'
    }))

    // Parse unit_types if available
    let unitTypes = []
    if (development.unit_types) {
      try {
        const parsed = typeof development.unit_types === 'string' 
          ? JSON.parse(development.unit_types) 
          : development.unit_types
        unitTypes = parsed.database || []
      } catch {
        unitTypes = []
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        development: {
          id: development.id,
          title: development.title,
          total_units: development.total_units || 0,
          units_sold: development.units_sold || 0,
          units_left: development.units_left || 0
        },
        stats: {
          purposes: enrichedPurposes,
          categories: enrichedCategories,
          types: enrichedTypes,
          subtypes: enrichedSubtypes,
          unitTypes: unitTypes
        }
      }
    })

  } catch (error) {
    console.error('Error fetching development stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

