import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    let finalUserId = userId

    // Get user_id from slug if needed
    if (slug && !userId) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', slug)
        .single()

      if (devError || !developer) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }

      finalUserId = developer.developer_id
    }

    // OPTIMIZED: Fetch only what we need, aggregate in minimal queries
    // 1. Get sales data for all aggregations in ONE query
    const { data: salesData, error: salesError, count: totalSales } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_type, sale_price, sale_source, listing_id', { count: 'exact' })
      .eq('user_id', finalUserId)

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            total_sales: 0,
            total_revenue: 0,
            by_type: { sold: { count: 0, revenue: 0 }, rented: { count: 0, revenue: 0 } },
            by_source: {},
            by_purpose: {},
            by_type_property: {},
            by_category: {},
            by_subtype: {}
          }
        }
      })
    }

    // Calculate totals
    const totalRevenue = salesData.reduce((sum, s) => sum + (s.sale_price || 0), 0)

    // 2. Aggregate by sale_type (sold/rented) - THIS IS "BY PURPOSE" (Sale/Rent/Lease)
    const by_purpose = {}
    salesData.forEach(sale => {
      const saleType = sale.sale_type || 'sold'
      const typeName = saleType === 'sold' ? 'Sale' : saleType === 'rented' ? 'Rent' : 'Lease'
      if (!by_purpose[typeName]) {
        by_purpose[typeName] = { count: 0, revenue: 0, name: typeName }
      }
      by_purpose[typeName].count++
      by_purpose[typeName].revenue += (sale.sale_price || 0)
    })

    // 3. Aggregate by source
    const by_source = {}
    salesData.forEach(sale => {
      const source = sale.sale_source || 'Iska Homes'
      if (!by_source[source]) {
        by_source[source] = { count: 0, revenue: 0 }
      }
      by_source[source].count++
      by_source[source].revenue += (sale.sale_price || 0)
    })

    // 4. Get unique listing IDs for taxonomy breakdowns
    const listingIds = [...new Set(salesData.map(s => s.listing_id).filter(Boolean))]
    const salesMap = salesData.reduce((acc, sale) => {
      if (!acc[sale.listing_id]) acc[sale.listing_id] = []
      acc[sale.listing_id].push(sale.sale_price || 0)
      return acc
    }, {})

    // 4. Fetch listings with taxonomy (single query)
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, types, categories, listing_types')
      .in('id', listingIds)

    // 5. Aggregate by property type, category, subtype
    const by_type_property = {}
    const by_category = {}
    const by_subtype = {}

    if (listings) {
      listings.forEach(listing => {
        const salePrices = salesMap[listing.id] || [0]
        const totalPrice = salePrices.reduce((sum, p) => sum + p, 0)

        // By property type
        if (listing.types && Array.isArray(listing.types)) {
          listing.types.forEach(type => {
            const typeId = typeof type === 'object' ? type.id : type
            const typeName = typeof type === 'object' ? type.name : typeId
            if (!by_type_property[typeId]) {
              by_type_property[typeId] = { count: 0, revenue: 0, name: typeName || typeId }
            }
            by_type_property[typeId].count += salePrices.length
            by_type_property[typeId].revenue += totalPrice
          })
        }

        // By category
        if (listing.categories && Array.isArray(listing.categories)) {
          listing.categories.forEach(category => {
            const categoryId = typeof category === 'object' ? category.id : category
            const categoryName = typeof category === 'object' ? category.name : categoryId
            if (!by_category[categoryId]) {
              by_category[categoryId] = { count: 0, revenue: 0, name: categoryName || categoryId }
            }
            by_category[categoryId].count += salePrices.length
            by_category[categoryId].revenue += totalPrice
          })
        }

        // By subtype
        if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
          listing.listing_types.database.forEach(subtype => {
            const subtypeId = typeof subtype === 'object' ? subtype.id : subtype
            const subtypeName = typeof subtype === 'object' ? subtype.name : subtypeId
            if (!by_subtype[subtypeId]) {
              by_subtype[subtypeId] = { count: 0, revenue: 0, name: subtypeName || subtypeId }
            }
            by_subtype[subtypeId].count += salePrices.length
            by_subtype[subtypeId].revenue += totalPrice
          })
        }
      })
    }

    // 6. Fetch taxonomy names only for IDs without names (optimized - parallel)
    const typeIds = Object.keys(by_type_property).filter(id => !by_type_property[id].name || by_type_property[id].name === id)
    const categoryIds = Object.keys(by_category).filter(id => !by_category[id].name || by_category[id].name === id)
    const subtypeIds = Object.keys(by_subtype).filter(id => !by_subtype[id].name || by_subtype[id].name === id)

    if (typeIds.length > 0 || categoryIds.length > 0 || subtypeIds.length > 0) {
      const [typesResult, categoriesResult, subtypesResult] = await Promise.all([
        typeIds.length > 0 ? supabaseAdmin.from('property_types').select('id, name').in('id', typeIds) : Promise.resolve({ data: [] }),
        categoryIds.length > 0 ? supabaseAdmin.from('property_categories').select('id, name').in('id', categoryIds) : Promise.resolve({ data: [] }),
        subtypeIds.length > 0 ? supabaseAdmin.from('property_subtypes').select('id, name').in('id', subtypeIds) : Promise.resolve({ data: [] })
      ])

      typesResult.data?.forEach(t => {
        if (by_type_property[t.id]) by_type_property[t.id].name = t.name
      })
      categoriesResult.data?.forEach(c => {
        if (by_category[c.id]) by_category[c.id].name = c.name
      })
      subtypesResult.data?.forEach(s => {
        if (by_subtype[s.id]) by_subtype[s.id].name = s.name
      })
    }

    // 7. By sale type (sold/rented) - separate from purpose
    const by_type = { sold: { count: 0, revenue: 0 }, rented: { count: 0, revenue: 0 } }
    salesData.forEach(sale => {
      const saleType = sale.sale_type || 'sold'
      if (saleType === 'sold' || saleType === 'rented') {
        by_type[saleType].count++
        by_type[saleType].revenue += (sale.sale_price || 0)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_sales: totalSales || 0,
          total_revenue: totalRevenue,
          by_type,
          by_source,
          by_purpose, // This is Sale/Rent/Lease (sale_type)
          by_type_property, // This is Apartments, Offices, etc.
          by_category,
          by_subtype
        }
      }
    })

  } catch (error) {
    console.error('Sales summary fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

