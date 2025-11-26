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
    let primaryCurrency = 'USD' // Default fallback

    // If slug provided, get user_id from developers table
    if (slug && !userId) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id, total_revenue, total_sales, estimated_revenue, company_locations, default_currency')
        .eq('slug', slug)
        .single()

      if (devError || !developer) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }

      finalUserId = developer.developer_id
      
      // Get primary currency from company_locations
      if (developer.company_locations && Array.isArray(developer.company_locations)) {
        const primaryLocation = developer.company_locations.find(
          loc => loc.primary_location === true || loc.primary_location === 'true'
        )
        if (primaryLocation?.currency) {
          primaryCurrency = primaryLocation.currency
        }
      }
      
      // Fallback to default_currency if primary location currency not found
      if (primaryCurrency === 'USD' && developer.default_currency) {
        let defaultCurrency = developer.default_currency
        if (typeof defaultCurrency === 'string') {
          try {
            defaultCurrency = JSON.parse(defaultCurrency)
          } catch (e) {
            // Ignore parse error
          }
        }
        if (defaultCurrency?.code) {
          primaryCurrency = defaultCurrency.code
        }
      }
    } else if (userId) {
      // Fetch developer data
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('total_revenue, total_sales, estimated_revenue, company_locations, default_currency')
        .eq('developer_id', userId)
        .single()
      
      if (developer) {
        // Get primary currency from company_locations
        if (developer.company_locations && Array.isArray(developer.company_locations)) {
          const primaryLocation = developer.company_locations.find(
            loc => loc.primary_location === true || loc.primary_location === 'true'
          )
          if (primaryLocation?.currency) {
            primaryCurrency = primaryLocation.currency
          }
        }
        
        // Fallback to default_currency if primary location currency not found
        if (primaryCurrency === 'USD' && developer.default_currency) {
          let defaultCurrency = developer.default_currency
          if (typeof defaultCurrency === 'string') {
            try {
              defaultCurrency = JSON.parse(defaultCurrency)
            } catch (e) {
              // Ignore parse error
            }
          }
          if (defaultCurrency?.code) {
            primaryCurrency = defaultCurrency.code
          }
        }
      }
    }

    // Use SQL SUM aggregation to get total revenue from sales_listings
    const { data: revenueResult, error: revenueError } = await supabaseAdmin
      .rpc('get_sales_revenue_summary', { p_user_id: finalUserId })

    let totalRevenue = 0
    if (revenueError) {
      console.error('Error calling RPC function for revenue:', revenueError)
      // Fallback to 0 if function doesn't exist
      totalRevenue = 0
    } else {
      // RPC function returns aggregated result with SQL SUM
      totalRevenue = revenueResult?.[0]?.total_revenue || revenueResult?.total_revenue || 0
    }

    // Fetch sales for other calculations
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_price, sale_date, sale_timestamp, listing_id')
      .eq('user_id', finalUserId)
      .order('sale_timestamp', { ascending: false })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    // Fetch active listings for expected revenue
    const { data: activeListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('estimated_revenue, global_price, created_at')
      .eq('user_id', finalUserId)
      .in('listing_status', ['active', 'draft'])
      .eq('upload_status', 'completed')

    const totalUnitsSold = sales?.length || 0

    // Expected revenue from active listings (use user's currency)
    const expectedRevenue = activeListings?.reduce((sum, listing) => {
      const revenue = listing.estimated_revenue?.estimated_revenue || listing.estimated_revenue?.price || 0
      return sum + revenue
    }, 0) || 0

    // Calculate average sales time (days from listing creation to sale)
    let totalDaysOnMarket = 0
    let salesWithDates = 0

    if (sales && activeListings) {
      const listingsMap = activeListings.reduce((acc, listing) => {
        acc[listing.id] = listing
        return acc
      }, {})

      // Fetch all listings to get created_at dates
      const listingIds = sales.map(s => s.listing_id).filter(Boolean)
      if (listingIds.length > 0) {
        const { data: allListings } = await supabaseAdmin
          .from('listings')
          .select('id, created_at')
          .in('id', listingIds)

        if (allListings) {
          const listingsMap = allListings.reduce((acc, listing) => {
            acc[listing.id] = listing
            return acc
          }, {})

          sales.forEach(sale => {
            const listing = listingsMap[sale.listing_id]
            if (listing?.created_at && sale.sale_date) {
              const listedDate = new Date(listing.created_at)
              const soldDate = new Date(sale.sale_date)
              const diffTime = Math.abs(soldDate - listedDate)
              const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              totalDaysOnMarket += days
              salesWithDates++
            }
          })
        }
      }
    }

    const averageSalesTime = salesWithDates > 0 ? Math.round(totalDaysOnMarket / salesWithDates) : 0

    // Calculate leads to sales conversion rate: (total_units_sold / total_leads) * 100
    // This shows what percentage of leads converted to sales
    let totalLeads = 0
    let leadsToSales = 0

    // Fetch total leads from user_analytics (aggregated total for the user)
    const { data: userAnalytics } = await supabaseAdmin
      .from('user_analytics')
      .select('total_leads')
      .eq('user_id', finalUserId)
      .single()

    if (userAnalytics?.total_leads) {
      totalLeads = userAnalytics.total_leads
    } else {
      // Fallback: Sum leads from listing_analytics for all user's listings
      const { data: allListings } = await supabaseAdmin
        .from('listings')
        .select('id')
        .eq('user_id', finalUserId)
        .eq('account_type', 'developer')

      if (allListings && allListings.length > 0) {
        const listingIds = allListings.map(l => l.id)
        const { data: analytics } = await supabaseAdmin
          .from('listing_analytics')
          .select('total_leads')
          .in('listing_id', listingIds)

        if (analytics) {
          totalLeads = analytics.reduce((sum, a) => sum + (a.total_leads || 0), 0)
        }
      }
    }

    // Calculate conversion rate: (sales / leads) * 100
    // Example: 10 sales from 100 leads = 10% conversion rate
    leadsToSales = totalLeads > 0 ? (totalUnitsSold / totalLeads) * 100 : 0

    // Get developer data for total_revenue if available
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('total_revenue, total_sales, estimated_revenue')
      .eq('developer_id', finalUserId)
      .single()

    const overview = {
      totalRevenue: totalRevenue, // Use calculated SUM instead of developer.total_revenue
      totalUnitsSold: developer?.total_sales || totalUnitsSold,
      expectedRevenue: developer?.estimated_revenue || expectedRevenue,
      averageSalesTime: averageSalesTime,
      leadsToSales: Math.round(leadsToSales * 100) / 100, // Round to 2 decimal places
      currency: primaryCurrency // Include currency in response
    }

    return NextResponse.json({
      success: true,
      data: { overview }
    })

  } catch (error) {
    console.error('Sales overview fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

