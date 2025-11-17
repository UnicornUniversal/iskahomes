import { supabaseAdmin } from '@/lib/supabase'

/**
 * Helper functions to update the new admin analytics tables
 * These tables are aggregated snapshots, not event logs
 */

// Calculate time dimensions from date
function getTimeDimensions(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const quarter = `Q${Math.floor(d.getMonth() / 3) + 1}`
  
  // Calculate ISO week
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  const week = `${year}-W${String(weekNum).padStart(2, '0')}`
  
  // Day of week (1=Monday, 7=Sunday)
  const day = d.getDay() === 0 ? 7 : d.getDay()
  const hour = d.getHours()
  
  return {
    date: d.toISOString().split('T')[0],
    hour,
    day,
    week,
    month: `${year}-${month}`,
    quarter: `${year}-${quarter}`,
    year
  }
}

/**
 * Update admin_listings_analytics
 * Called when listing is finalized/published (listing_status='active' AND completed)
 */
export async function updateAdminListingsAnalytics(listing) {
  try {
    const timeDims = getTimeDimensions()
    
    // Get or create today's record
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_listings_analytics')
      .select('*')
      .eq('date', timeDims.date)
      .maybeSingle()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching admin_listings_analytics:', fetchError)
      return
    }
    
    // Fetch all active listings to recalculate aggregates
    const { data: allListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, account_type, listing_status, status, country, state, city, town, purposes, types, categories, listing_types, estimated_revenue, global_price')
      .in('listing_status', ['active', 'sold', 'rented'])
      .in('listing_condition', ['completed'])
      .eq('upload_status', 'completed')
    
    if (listingsError) {
      console.error('Error fetching listings for analytics:', listingsError)
      return
    }
    
    // Calculate aggregates
    const totalListings = {
      developers: 0,
      agents: 0,
      agencies: 0,
      total: allListings?.length || 0
    }
    
    const listingsByStatus = {
      active: 0,
      inactive: 0,
      available: 0,
      unavailable: 0,
      draft: 0,
      archived: 0,
      sold: 0,
      rented: 0,
      total: 0
    }
    
    const listingsByListingStatus = {
      draft: 0,
      active: 0,
      archived: 0,
      sold: 0,
      rented: 0,
      total: 0
    }
    
    // Location aggregations
    const countryMap = {}
    const stateMap = {}
    const cityMap = {}
    const townMap = {}
    
    // Category aggregations
    const purposeMap = {}
    const typeMap = {}
    const subtypeMap = {}
    const categoryMap = {}
    
    // User type aggregations
    const developersMap = {}
    const agentsMap = {}
    const agenciesMap = {}
    
    allListings?.forEach(listing => {
      // Count by account type
      if (listing.account_type === 'developer') totalListings.developers++
      else if (listing.account_type === 'agent') totalListings.agents++
      else if (listing.account_type === 'agency') totalListings.agencies++
      
      // Count by status
      if (listing.status) {
        const statusLower = listing.status.toLowerCase()
        if (listingsByStatus.hasOwnProperty(statusLower)) {
          listingsByStatus[statusLower]++
        }
      }
      
      // Count by listing_status
      if (listing.listing_status) {
        const listingStatusLower = listing.listing_status.toLowerCase()
        if (listingsByListingStatus.hasOwnProperty(listingStatusLower)) {
          listingsByListingStatus[listingStatusLower]++
        }
      }
      
      // Get estimated revenue in USD (from global_price)
      let estimatedRevenueUSD = 0
      if (listing.global_price?.estimated_revenue) {
        estimatedRevenueUSD = parseFloat(listing.global_price.estimated_revenue) || 0
      } else if (listing.estimated_revenue?.estimated_revenue) {
        // Fallback to estimated_revenue if global_price not available
        estimatedRevenueUSD = parseFloat(listing.estimated_revenue.estimated_revenue) || 0
      }
      
      // Location aggregations
      if (listing.country) {
        if (!countryMap[listing.country]) {
          countryMap[listing.country] = { total_listings: 0, total_amount: 0 }
        }
        countryMap[listing.country].total_listings++
        countryMap[listing.country].total_amount += estimatedRevenueUSD
      }
      
      if (listing.state) {
        const key = `${listing.state}${listing.country ? `_${listing.country}` : ''}`
        if (!stateMap[key]) {
          stateMap[key] = { name: listing.state, country: listing.country, total_listings: 0, total_amount: 0 }
        }
        stateMap[key].total_listings++
        stateMap[key].total_amount += estimatedRevenueUSD
      }
      
      if (listing.city) {
        const key = `${listing.city}${listing.state ? `_${listing.state}` : ''}${listing.country ? `_${listing.country}` : ''}`
        if (!cityMap[key]) {
          cityMap[key] = { name: listing.city, state: listing.state, country: listing.country, total_listings: 0, total_amount: 0 }
        }
        cityMap[key].total_listings++
        cityMap[key].total_amount += estimatedRevenueUSD
      }
      
      if (listing.town) {
        const key = `${listing.town}${listing.city ? `_${listing.city}` : ''}${listing.state ? `_${listing.state}` : ''}${listing.country ? `_${listing.country}` : ''}`
        if (!townMap[key]) {
          townMap[key] = { name: listing.town, city: listing.city, state: listing.state, country: listing.country, total_listings: 0, total_amount: 0 }
        }
        townMap[key].total_listings++
        townMap[key].total_amount += estimatedRevenueUSD
      }
      
      // Category aggregations
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purpose => {
          const id = typeof purpose === 'object' ? purpose.id : purpose
          if (!purposeMap[id]) {
            purposeMap[id] = { id, name: typeof purpose === 'object' ? purpose.name : id, total_listings: 0, total_amount: 0 }
          }
          purposeMap[id].total_listings++
          purposeMap[id].total_amount += estimatedRevenueUSD
        })
      }
      
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(type => {
          const id = typeof type === 'object' ? type.id : type
          if (!typeMap[id]) {
            typeMap[id] = { id, name: typeof type === 'object' ? type.name : id, total_listings: 0, total_amount: 0 }
          }
          typeMap[id].total_listings++
          typeMap[id].total_amount += estimatedRevenueUSD
        })
      }
      
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtype => {
          const id = typeof subtype === 'object' ? subtype.id : subtype
          if (!subtypeMap[id]) {
            subtypeMap[id] = { id, name: typeof subtype === 'object' ? subtype.name : id, total_listings: 0, total_amount: 0 }
          }
          subtypeMap[id].total_listings++
          subtypeMap[id].total_amount += estimatedRevenueUSD
        })
      }
      
      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach(category => {
          const id = typeof category === 'object' ? category.id : category
          if (!categoryMap[id]) {
            categoryMap[id] = { id, name: typeof category === 'object' ? category.name : id, total_listings: 0, total_amount: 0 }
          }
          categoryMap[id].total_listings++
          categoryMap[id].total_amount += estimatedRevenueUSD
        })
      }
      
      // User type aggregations
      if (listing.account_type === 'developer') {
        const devId = listing.user_id
        if (!developersMap[devId]) {
          developersMap[devId] = { total_listings: 0, total_estimated_revenue: 0 }
        }
        developersMap[devId].total_listings++
        developersMap[devId].total_estimated_revenue += estimatedRevenueUSD
      } else if (listing.account_type === 'agent') {
        const agentId = listing.user_id
        if (!agentsMap[agentId]) {
          agentsMap[agentId] = { total_listings: 0, total_estimated_revenue: 0 }
        }
        agentsMap[agentId].total_listings++
        agentsMap[agentId].total_estimated_revenue += estimatedRevenueUSD
      } else if (listing.account_type === 'agency') {
        const agencyId = listing.user_id
        if (!agenciesMap[agencyId]) {
          agenciesMap[agencyId] = { total_listings: 0, total_estimated_revenue: 0 }
        }
        agenciesMap[agencyId].total_listings++
        agenciesMap[agencyId].total_estimated_revenue += estimatedRevenueUSD
      }
    })
    
    // Calculate percentages and format arrays
    const formatLocationArray = (map) => {
      const total = allListings?.length || 1
      return Object.values(map).map(item => ({
        id: typeof item === 'object' && item.name ? item.name : item,
        name: typeof item === 'object' && item.name ? item.name : item,
        ...(typeof item === 'object' && item.country ? { country: item.country } : {}),
        ...(typeof item === 'object' && item.state ? { state: item.state } : {}),
        ...(typeof item === 'object' && item.city ? { city: item.city } : {}),
        total_listings: typeof item === 'object' ? item.total_listings : 0,
        percentage: typeof item === 'object' ? parseFloat(((item.total_listings / total) * 100).toFixed(2)) : 0,
        total_amount: typeof item === 'object' ? parseFloat(item.total_amount.toFixed(2)) : 0
      }))
    }
    
    const formatCategoryArray = (map) => {
      const total = allListings?.length || 1
      return Object.values(map).map(item => ({
        id: item.id,
        name: item.name,
        total_listings: item.total_listings,
        percentage: parseFloat(((item.total_listings / total) * 100).toFixed(2)),
        total_amount: parseFloat(item.total_amount.toFixed(2))
      }))
    }
    
    // Calculate totals for status
    listingsByStatus.total = Object.values(listingsByStatus).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
    listingsByListingStatus.total = Object.values(listingsByListingStatus).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
    
    // Calculate user type totals
    const listingsByDevelopers = {
      total_developers: Object.keys(developersMap).length,
      total_listings: totalListings.developers,
      total_estimated_revenue: parseFloat(Object.values(developersMap).reduce((sum, dev) => sum + dev.total_estimated_revenue, 0).toFixed(2))
    }
    
    const listingsByAgents = {
      total_agents: Object.keys(agentsMap).length,
      total_listings: totalListings.agents,
      total_estimated_revenue: parseFloat(Object.values(agentsMap).reduce((sum, agent) => sum + agent.total_estimated_revenue, 0).toFixed(2))
    }
    
    const listingsByAgencies = {
      total_agencies: Object.keys(agenciesMap).length,
      total_listings: totalListings.agencies,
      total_estimated_revenue: parseFloat(Object.values(agenciesMap).reduce((sum, agency) => sum + agency.total_estimated_revenue, 0).toFixed(2))
    }
    
    const updateData = {
      ...timeDims,
      total_listings: totalListings,
      listings_by_status: listingsByStatus,
      listings_by_listing_status: listingsByListingStatus,
      listings_by_country: formatLocationArray(countryMap),
      listings_by_state: formatLocationArray(stateMap),
      listings_by_city: formatLocationArray(cityMap),
      listings_by_town: formatLocationArray(townMap),
      listings_by_property_purpose: formatCategoryArray(purposeMap),
      listings_by_property_type: formatCategoryArray(typeMap),
      listings_by_sub_type: formatCategoryArray(subtypeMap),
      listings_by_category: formatCategoryArray(categoryMap),
      listings_by_developers: listingsByDevelopers,
      listings_by_agents: listingsByAgents,
      listings_by_agencies: listingsByAgencies,
      updated_at: new Date().toISOString()
    }
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('admin_listings_analytics')
        .update(updateData)
        .eq('id', existing.id)
      
      if (updateError) {
        console.error('Error updating admin_listings_analytics:', updateError)
      } else {
        console.log('✅ admin_listings_analytics updated successfully')
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from('admin_listings_analytics')
        .insert([{
          ...updateData,
          created_at: new Date().toISOString()
        }])
      
      if (insertError) {
        console.error('Error inserting admin_listings_analytics:', insertError)
      } else {
        console.log('✅ admin_listings_analytics created successfully')
      }
    }
  } catch (error) {
    console.error('Error in updateAdminListingsAnalytics:', error)
  }
}

/**
 * Update admin_sales_analytics
 * Called when:
 * 1. Listing status changes to sold/rented
 * 2. Pricing changes (updates estimated_revenue)
 * 3. Listing is finalized (updates estimated_revenue for awaiting sales)
 */
export async function updateAdminSalesAnalytics(listing, operation = 'update') {
  try {
    const timeDims = getTimeDimensions()
    
    // Get or create today's record
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_sales_analytics')
      .select('*')
      .eq('date', timeDims.date)
      .maybeSingle()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching admin_sales_analytics:', fetchError)
      return
    }
    
    // Fetch all listings to calculate aggregates
    const { data: allListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, account_type, listing_type, listing_status, estimated_revenue, global_price, user_id, development_id')
      .in('listing_status', ['active', 'sold', 'rented', 'draft'])
      .in('listing_condition', ['completed'])
      .eq('upload_status', 'completed')
    
    if (listingsError) {
      console.error('Error fetching listings for sales analytics:', listingsError)
      return
    }
    
    // Fetch sales_listings to get actual sales data
    const { data: salesListings, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('listing_id, sale_type, sale_price, currency')
    
    if (salesError) {
      console.error('Error fetching sales_listings:', salesError)
    }
    
    // Create sales map - map sale_type from 'sold'/'rented' to 'sale'/'rent'
    const salesMap = {}
    salesListings?.forEach(sale => {
      salesMap[sale.listing_id] = {
        ...sale,
        mappedType: sale.sale_type === 'sold' ? 'sale' : (sale.sale_type === 'rented' ? 'rent' : 'lease')
      }
    })
    
    // Initialize aggregates
    let totalRevenue = 0
    let totalUnitsSold = 0
    let totalEstimatedRevenue = 0
    let totalUnitsAwaitingSales = 0
    
    const salesByType = {
      sale: { total_units_sold: 0, total_revenue: 0, total_amount: 0 },
      rent: { total_units_sold: 0, total_revenue: 0, total_amount: 0 },
      lease: { total_units_sold: 0, total_revenue: 0, total_amount: 0 },
      total: { total_units_sold: 0, total_revenue: 0, total_amount: 0 }
    }
    
    const developers = {
      total_units_awaiting_sales: 0,
      total_estimated_revenue: 0,
      total_units_sold: 0,
      total_revenue: 0,
      sales_by_type: {
        sale: { total_units_sold: 0, total_revenue: 0 },
        rent: { total_units_sold: 0, total_revenue: 0 },
        lease: { total_units_sold: 0, total_revenue: 0 }
      }
    }
    
    const agents = {
      total_units_awaiting_sales: 0,
      total_estimated_revenue: 0,
      total_units_sold: 0,
      total_revenue: 0,
      sales_by_type: {
        sale: { total_units_sold: 0, total_revenue: 0 },
        rent: { total_units_sold: 0, total_revenue: 0 },
        lease: { total_units_sold: 0, total_revenue: 0 }
      }
    }
    
    const agencies = {
      total_units_awaiting_sales: 0,
      total_estimated_revenue: 0,
      total_units_sold: 0,
      total_revenue: 0,
      sales_by_type: {
        sale: { total_units_sold: 0, total_revenue: 0 },
        rent: { total_units_sold: 0, total_revenue: 0 },
        lease: { total_units_sold: 0, total_revenue: 0 }
      }
    }
    
    // Process each listing
    allListings?.forEach(listing => {
      const isSold = listing.listing_status === 'sold'
      const isRented = listing.listing_status === 'rented'
      const isLeased = false // Add if you track leases separately
      const isActive = listing.listing_status === 'active' || listing.listing_status === 'draft'
      
      // Get revenue in USD from global_price (for admin analytics - standard currency)
      let estimatedRevenueUSD = 0
      if (listing.global_price?.estimated_revenue) {
        estimatedRevenueUSD = parseFloat(listing.global_price.estimated_revenue) || 0
      }
      
      // Get sale data
      const sale = salesMap[listing.id]
      let saleRevenueUSD = 0
      if (sale) {
        // For admin analytics, we need USD. If sale_price is in different currency, 
        // we should use global_price.estimated_revenue instead
        // But for now, use global_price.estimated_revenue as the standard
        saleRevenueUSD = estimatedRevenueUSD || 0
      }
      
      if (isSold || isRented || isLeased) {
        // Sold/rented/leased
        totalUnitsSold++
        const revenueToUse = saleRevenueUSD || estimatedRevenueUSD
        totalRevenue += revenueToUse
        
        // Map sale_type: 'sold' → 'sale', 'rented' → 'rent'
        const saleType = sale?.mappedType || (isSold ? 'sale' : (isRented ? 'rent' : 'lease'))
        salesByType[saleType].total_units_sold++
        salesByType[saleType].total_revenue += revenueToUse
        salesByType[saleType].total_amount = salesByType[saleType].total_revenue
        
        // By user type - developers only count if account_type='developer' AND listing_type='unit'
        const isDeveloperUnit = listing.account_type === 'developer' && listing.listing_type === 'unit'
        
        if (isDeveloperUnit) {
          developers.total_units_sold++
          developers.total_revenue += revenueToUse
          developers.sales_by_type[saleType].total_units_sold++
          developers.sales_by_type[saleType].total_revenue += revenueToUse
        } else if (listing.account_type === 'agent') {
          agents.total_units_sold++
          agents.total_revenue += revenueToUse
          agents.sales_by_type[saleType].total_units_sold++
          agents.sales_by_type[saleType].total_revenue += revenueToUse
        } else if (listing.account_type === 'agency') {
          agencies.total_units_sold++
          agencies.total_revenue += revenueToUse
          agencies.sales_by_type[saleType].total_units_sold++
          agencies.sales_by_type[saleType].total_revenue += revenueToUse
        }
      } else if (isActive) {
        // Awaiting sales
        totalUnitsAwaitingSales++
        totalEstimatedRevenue += estimatedRevenueUSD
        
        // Developers only count if account_type='developer' AND listing_type='unit'
        const isDeveloperUnit = listing.account_type === 'developer' && listing.listing_type === 'unit'
        
        if (isDeveloperUnit) {
          developers.total_units_awaiting_sales++
          developers.total_estimated_revenue += estimatedRevenueUSD
        } else if (listing.account_type === 'agent') {
          agents.total_units_awaiting_sales++
          agents.total_estimated_revenue += estimatedRevenueUSD
        } else if (listing.account_type === 'agency') {
          agencies.total_units_awaiting_sales++
          agencies.total_estimated_revenue += estimatedRevenueUSD
        }
      }
    })
    
    // Calculate totals
    salesByType.total.total_units_sold = totalUnitsSold
    salesByType.total.total_revenue = totalRevenue
    salesByType.total.total_amount = totalRevenue
    
    // Fetch developments aggregate
    const { data: developments, error: devError } = await supabaseAdmin
      .from('developments')
      .select('id, total_units, total_units_sold, total_estimated_revenue, total_revenue')
    
    const developmentsAgg = {
      total_developments: developments?.length || 0,
      total_units_awaiting_sales: developments?.reduce((sum, d) => sum + (d.total_units - (d.total_units_sold || 0)), 0) || 0,
      total_estimated_revenue: parseFloat(developments?.reduce((sum, d) => sum + (d.total_estimated_revenue || 0), 0).toFixed(2)) || 0,
      total_units_sold: developments?.reduce((sum, d) => sum + (d.total_units_sold || 0), 0) || 0,
      total_revenue: parseFloat(developments?.reduce((sum, d) => {
        const rev = d.total_revenue
        return sum + (typeof rev === 'object' ? (rev.total_revenue || 0) : (rev || 0))
      }, 0).toFixed(2)) || 0
    }
    
    const updateData = {
      ...timeDims,
      sales_by_type: salesByType,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_listings_sold: totalUnitsSold, // Column name is total_listings_sold, not total_units_sold
      total_estimated_revenue: parseFloat(totalEstimatedRevenue.toFixed(2)),
      total_listings_awaiting_sales: totalUnitsAwaitingSales, // Fixed: was total_units_awaiting_sales
      developers: developers,
      agents: agents,
      agencies: agencies,
      developments: developmentsAgg,
      updated_at: new Date().toISOString()
    }
    
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('admin_sales_analytics')
        .update(updateData)
        .eq('id', existing.id)
      
      if (updateError) {
        console.error('Error updating admin_sales_analytics:', updateError)
      } else {
        console.log('✅ admin_sales_analytics updated successfully')
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('admin_sales_analytics')
        .insert([{
          ...updateData,
          created_at: new Date().toISOString()
        }])
      
      if (insertError) {
        console.error('Error inserting admin_sales_analytics:', insertError)
      } else {
        console.log('✅ admin_sales_analytics created successfully')
      }
    }
  } catch (error) {
    console.error('Error in updateAdminSalesAnalytics:', error)
  }
}

