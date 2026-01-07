import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { processCurrencyConversions } from '@/lib/currencyConversion'
import { updateAdminAnalytics } from '@/lib/adminAnalytics'
import { updateAdminListingsAnalytics, updateAdminSalesAnalytics } from '@/lib/adminAnalyticsHelpers'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to map status field to listing_status
function mapStatusToListingStatus(status) {
  if (!status) return null
  
  const statusLower = status.toLowerCase().trim()
  
  // Map "Sold", "Rented Out", or "Taken" to listing_status
  if (statusLower === 'sold') {
    return 'sold'
  } else if (statusLower === 'rented out') {
    return 'rented'
  } else if (statusLower === 'taken') {
    // "Taken" is a collective term - determine if it should be 'sold' or 'rented'
    // For now, default to 'sold' but this could be made configurable
    return 'sold'
  }
  
  return null
}

// Helper function to check if status indicates sold/rented/taken
function isStatusSoldRentedOrTaken(status) {
  if (!status) return false
  
  const statusLower = status.toLowerCase().trim()
  return ['sold', 'rented out', 'taken'].includes(statusLower)
}

// Helper function to generate slug from title
function generateSlug(title) {
  if (!title) return null
  
  // Convert to lowercase, remove special characters, replace spaces with hyphens
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  
  // If slug is empty after processing, use a fallback
  if (!slug || slug.length === 0) {
    return null
  }
  
  return slug
}

// Helper function to generate unique slug
async function generateUniqueSlug(baseSlug, listingId = null) {
  if (!baseSlug) return null
  
  let slug = baseSlug
  let counter = 0
  let isUnique = false
  
  while (!isUnique) {
    // Check if slug exists
    let query = supabaseAdmin
      .from('listings')
      .select('id')
      .eq('slug', slug)
      .limit(1)
    
    // If updating existing listing, exclude it from the check
    if (listingId) {
      query = query.neq('id', listingId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error checking slug uniqueness:', error)
      // If error, append timestamp to make it unique
      return `${baseSlug}-${Date.now()}`
    }
    
    if (!data || data.length === 0) {
      // Slug is unique
      isUnique = true
    } else {
      // Slug exists, append counter
      counter++
      slug = `${baseSlug}-${counter}`
    }
  }
  
  return slug
}

// Helper function to calculate development stats from listings
async function calculateDevelopmentStats(developmentId) {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('purposes, types, categories, listing_types, estimated_revenue')
      .eq('development_id', developmentId)

    if (error) {
      console.error('Error fetching listings for stats:', error)
      return null
    }

    if (!listings || listings.length === 0) {
      return {
        property_purposes_stats: [],
        property_categories_stats: [],
        property_types_stats: [],
        property_subtypes_stats: [],
        total_estimated_revenue: 0
      }
    }

    const totalListings = listings.length
    let totalEstimatedRevenue = 0
    listings.forEach(listing => {
      if (listing.estimated_revenue && typeof listing.estimated_revenue === 'object') {
        const revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
        if (typeof revenueValue === 'number' && revenueValue > 0) {
          totalEstimatedRevenue += revenueValue
        }
      }
    })

    const purposeCounts = {}
    const typeCounts = {}
    const categoryCounts = {}
    const subtypeCounts = {}

    listings.forEach(listing => {
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purposeId => {
          const id = typeof purposeId === 'object' ? purposeId.id : purposeId
          purposeCounts[id] = (purposeCounts[id] || 0) + 1
        })
      }
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(typeId => {
          const id = typeof typeId === 'object' ? typeId.id : typeId
          typeCounts[id] = (typeCounts[id] || 0) + 1
        })
      }
      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach(categoryId => {
          const id = typeof categoryId === 'object' ? categoryId.id : categoryId
          categoryCounts[id] = (categoryCounts[id] || 0) + 1
        })
      }
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtypeId => {
          const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
          subtypeCounts[id] = (subtypeCounts[id] || 0) + 1
        })
      }
    })

    const calculateStats = (counts, total) => {
      return Object.entries(counts).map(([id, count]) => ({
        category_id: id,
        total_amount: count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0
      }))
    }

    return {
      property_purposes_stats: calculateStats(purposeCounts, totalListings),
      property_categories_stats: calculateStats(categoryCounts, totalListings),
      property_types_stats: calculateStats(typeCounts, totalListings),
      property_subtypes_stats: calculateStats(subtypeCounts, totalListings),
      total_estimated_revenue: parseFloat(totalEstimatedRevenue.toFixed(2))
    }
  } catch (error) {
    console.error('Error calculating development stats:', error)
    return null
  }
}

// Helper function to update development after listing operations
async function updateDevelopmentAfterListing(developmentId, operation = 'update') {
  if (!developmentId) return

  try {
    const { data: development, error: devError } = await supabaseAdmin
      .from('developments')
      .select('total_units')
      .eq('id', developmentId)
      .single()

    if (devError || !development) {
      console.error('Error fetching development:', devError)
      return
    }

    let newTotalUnits = development.total_units || 0
    if (operation === 'delete') {
      newTotalUnits = Math.max(0, (newTotalUnits || 0) - 1)
    }

    const stats = await calculateDevelopmentStats(developmentId)
    const updateData = {}

    if (operation === 'delete') {
      updateData.total_units = newTotalUnits
    }

    if (stats) {
      updateData.property_purposes_stats = stats.property_purposes_stats
      updateData.property_categories_stats = stats.property_categories_stats
      updateData.property_types_stats = stats.property_types_stats
      updateData.property_subtypes_stats = stats.property_subtypes_stats
      if (stats.total_estimated_revenue !== undefined) {
        updateData.total_estimated_revenue = stats.total_estimated_revenue
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('developments')
        .update(updateData)
        .eq('id', developmentId)

      if (updateError) {
        console.error('Error updating development:', updateError)
      }
    }
  } catch (error) {
    console.error('Error in updateDevelopmentAfterListing:', error)
  }
}

// Helper function to calculate developer stats from all listings
async function calculateDeveloperStats(userId) {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('purposes, types, categories, listing_types, estimated_revenue, country, state, city, town, listing_status')
      .eq('user_id', userId)
      .eq('account_type', 'developer')
      .in('listing_status', ['active', 'sold', 'rented'])

    if (error) {
      console.error('Error fetching listings for developer stats:', error)
      return null
    }

    if (!listings || listings.length === 0) {
      return {
        property_purposes_stats: [],
        property_categories_stats: [],
        property_types_stats: [],
        property_subtypes_stats: [],
        country_stats: [],
        state_stats: [],
        city_stats: [],
        town_stats: []
      }
    }

    const totalListings = listings.length
    const purposeCounts = {}
    const typeCounts = {}
    const categoryCounts = {}
    const subtypeCounts = {}
    const countryStats = {}
    const stateStats = {}
    const cityStats = {}
    const townStats = {}

    listings.forEach(listing => {
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purposeId => {
          const id = typeof purposeId === 'object' ? purposeId.id : purposeId
          purposeCounts[id] = (purposeCounts[id] || 0) + 1
        })
      }
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(typeId => {
          const id = typeof typeId === 'object' ? typeId.id : typeId
          typeCounts[id] = (typeCounts[id] || 0) + 1
        })
      }
      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach(categoryId => {
          const id = typeof categoryId === 'object' ? categoryId.id : categoryId
          categoryCounts[id] = (categoryCounts[id] || 0) + 1
        })
      }
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtypeId => {
          const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
          subtypeCounts[id] = (subtypeCounts[id] || 0) + 1
        })
      }

      const isSoldOrRented = listing.listing_status === 'sold' || listing.listing_status === 'rented'
      let revenueAmount = 0
      if (isSoldOrRented && listing.estimated_revenue && typeof listing.estimated_revenue === 'object') {
        revenueAmount = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
        if (typeof revenueAmount !== 'number' || revenueAmount <= 0) {
          revenueAmount = 0
        }
      }

      if (listing.country) {
        if (!countryStats[listing.country]) {
          countryStats[listing.country] = { total_units: 0, unit_sales: 0, sales_amount: 0 }
        }
        countryStats[listing.country].total_units++
        if (isSoldOrRented) {
          countryStats[listing.country].unit_sales++
          countryStats[listing.country].sales_amount += revenueAmount
        }
      }
      if (listing.state) {
        if (!stateStats[listing.state]) {
          stateStats[listing.state] = { total_units: 0, unit_sales: 0, sales_amount: 0 }
        }
        stateStats[listing.state].total_units++
        if (isSoldOrRented) {
          stateStats[listing.state].unit_sales++
          stateStats[listing.state].sales_amount += revenueAmount
        }
      }
      if (listing.city) {
        if (!cityStats[listing.city]) {
          cityStats[listing.city] = { total_units: 0, unit_sales: 0, sales_amount: 0 }
        }
        cityStats[listing.city].total_units++
        if (isSoldOrRented) {
          cityStats[listing.city].unit_sales++
          cityStats[listing.city].sales_amount += revenueAmount
        }
      }
      if (listing.town) {
        if (!townStats[listing.town]) {
          townStats[listing.town] = { total_units: 0, unit_sales: 0, sales_amount: 0 }
        }
        townStats[listing.town].total_units++
        if (isSoldOrRented) {
          townStats[listing.town].unit_sales++
          townStats[listing.town].sales_amount += revenueAmount
        }
      }
    })

    const calculateStats = (counts, total) => {
      return Object.entries(counts).map(([id, count]) => ({
        category_id: id,
        total_amount: count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0
      }))
    }

    const calculateLocationStats = (locationData, total) => {
      return Object.entries(locationData).map(([location, data]) => ({
        location: location,
        total_units: data.total_units,
        unit_sales: data.unit_sales,
        sales_amount: Math.round(data.sales_amount),
        percentage: total > 0 ? Number(((data.total_units / total) * 100).toFixed(2)) : 0
      }))
    }

    return {
      property_purposes_stats: calculateStats(purposeCounts, totalListings),
      property_categories_stats: calculateStats(categoryCounts, totalListings),
      property_types_stats: calculateStats(typeCounts, totalListings),
      property_subtypes_stats: calculateStats(subtypeCounts, totalListings),
      country_stats: calculateLocationStats(countryStats, totalListings),
      state_stats: calculateLocationStats(stateStats, totalListings),
      city_stats: calculateLocationStats(cityStats, totalListings),
      town_stats: calculateLocationStats(townStats, totalListings)
    }
  } catch (error) {
    console.error('Error calculating developer stats:', error)
    return null
  }
}

// Helper function to recalculate and update developer metrics from actual listings
async function updateDeveloperAfterListing(userId, operation = 'update') {
  if (!userId) return

  try {
    console.log('🔄 Recalculating developer metrics for user:', userId, 'operation:', operation)
    
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id, total_units, total_developments, total_revenue, estimated_revenue')
      .eq('developer_id', userId)
      .single()

    if (devError || !developer) {
      console.error('Error fetching developer:', devError)
      return
    }

    const { count: totalUnitsCount, error: unitsError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('account_type', 'developer')
      .in('listing_status', ['active', 'sold', 'rented'])

    if (unitsError) {
      console.error('Error counting listings:', unitsError)
    }

    // Note: developments.developer_id stores developers.developer_id (not developers.id)
    const { count: totalDevelopmentsCount, error: devsError } = await supabaseAdmin
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developer.developer_id)

    if (devsError) {
      console.error('Error counting developments:', devsError)
    }

    // Recalculate total_revenue and total_sales from sales_listings table
    // This is the source of truth for actual sales
    const { data: salesListings, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_price')
      .eq('user_id', userId)

    let totalRevenue = 0
    let totalSales = 0
    if (!salesError && salesListings) {
      totalSales = salesListings.length // Count of actual sales
      salesListings.forEach(sale => {
        const salePrice = typeof sale.sale_price === 'string' 
          ? parseFloat(sale.sale_price) 
          : (sale.sale_price || 0)
        if (typeof salePrice === 'number' && salePrice > 0) {
          totalRevenue += salePrice
        }
      })
    }

    const { data: allListings, error: allError } = await supabaseAdmin
      .from('listings')
      .select('estimated_revenue')
      .eq('user_id', userId)
      .eq('account_type', 'developer')
      .in('listing_status', ['active', 'sold', 'rented'])

    let estimatedRevenue = 0
    if (!allError && allListings) {
      allListings.forEach(listing => {
        if (listing.estimated_revenue) {
          let revenueValue = 0
          if (typeof listing.estimated_revenue === 'object') {
            revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
          } else if (typeof listing.estimated_revenue === 'number') {
            revenueValue = listing.estimated_revenue
          } else if (typeof listing.estimated_revenue === 'string') {
            revenueValue = parseFloat(listing.estimated_revenue) || 0
          }
          
          if (typeof revenueValue === 'number' && revenueValue > 0) {
            estimatedRevenue += revenueValue
          }
        }
      })
    }

    const stats = await calculateDeveloperStats(userId)

    const updateData = {
      total_units: totalUnitsCount || 0,
      total_developments: totalDevelopmentsCount || 0,
      total_revenue: Math.round(totalRevenue),
      total_sales: totalSales,
      estimated_revenue: Math.round(estimatedRevenue)
    }

    if (stats) {
      updateData.property_purposes_stats = stats.property_purposes_stats
      updateData.property_categories_stats = stats.property_categories_stats
      updateData.property_types_stats = stats.property_types_stats
      updateData.property_subtypes_stats = stats.property_subtypes_stats
      updateData.country_stats = stats.country_stats
      updateData.state_stats = stats.state_stats
      updateData.city_stats = stats.city_stats
      updateData.town_stats = stats.town_stats
    }

    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update(updateData)
      .eq('id', developer.id)

    if (updateError) {
      console.error('Error updating developer metrics:', updateError)
    } else {
      console.log('✅ Developer metrics updated successfully')
    }
  } catch (error) {
    console.error('Error in updateDeveloperAfterListing:', error)
    console.error('Error stack:', error.stack)
  }
}

// Helper function to recalculate and update agent metrics from actual listings
async function updateAgentAfterListing(userId, operation = 'update') {
  if (!userId) return

  try {
    console.log('🔄 Recalculating agent metrics for user:', userId, 'operation:', operation)
    
    // Get agent record by agent_id (which matches listings.user_id)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, agent_id, total_listings, active_listings, total_commission, estimated_revenue')
      .eq('agent_id', userId)
      .single()

    if (agentError || !agent) {
      console.error('Error fetching agent:', agentError)
      return
    }

    // Recalculate total_listings from actual listings count (all completed listings)
    const { count: totalListingsCount, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('account_type', 'agent')
      .in('listing_status', ['active', 'sold', 'rented', 'draft'])

    if (listingsError) {
      console.error('Error counting listings:', listingsError)
    }

    // Recalculate active_listings (only active listings)
    const { count: activeListingsCount, error: activeError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('account_type', 'agent')
      .eq('listing_status', 'active')

    if (activeError) {
      console.error('Error counting active listings:', activeError)
    }

    // Recalculate estimated_revenue and total_commission from all listings
    const { data: allListings, error: allError } = await supabaseAdmin
      .from('listings')
      .select('estimated_revenue, commission_rate, listing_status')
      .eq('user_id', userId)
      .eq('account_type', 'agent')
      .in('listing_status', ['active', 'sold', 'rented'])

    let totalEstimatedRevenue = 0
    let totalCommission = 0

    if (!allError && allListings) {
      allListings.forEach(listing => {
        // Calculate estimated revenue
        if (listing.estimated_revenue) {
          let revenueValue = 0
          if (typeof listing.estimated_revenue === 'object') {
            revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
          } else if (typeof listing.estimated_revenue === 'number') {
            revenueValue = listing.estimated_revenue
          } else if (typeof listing.estimated_revenue === 'string') {
            revenueValue = parseFloat(listing.estimated_revenue) || 0
          }
          
          if (revenueValue > 0) {
            totalEstimatedRevenue += revenueValue
          }
        }

        // Calculate commission from commission_rate
        if (listing.commission_rate) {
          let commissionPercentage = 0
          if (typeof listing.commission_rate === 'object') {
            commissionPercentage = listing.commission_rate.percentage || 0
          } else if (typeof listing.commission_rate === 'number') {
            commissionPercentage = listing.commission_rate
          }

          if (commissionPercentage > 0 && listing.estimated_revenue) {
            let revenueValue = 0
            if (typeof listing.estimated_revenue === 'object') {
              revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
            } else if (typeof listing.estimated_revenue === 'number') {
              revenueValue = listing.estimated_revenue
            } else if (typeof listing.estimated_revenue === 'string') {
              revenueValue = parseFloat(listing.estimated_revenue) || 0
            }
            
            const commissionAmount = (revenueValue * commissionPercentage) / 100
            totalCommission += commissionAmount
          }
        }
      })
    }

    // Update agent table
    const updateData = {
      total_listings: totalListingsCount || 0,
      active_listings: activeListingsCount || 0,
      estimated_revenue: totalEstimatedRevenue.toFixed(2),
      total_commission: totalCommission.toFixed(2)
    }

    const { error: updateError } = await supabaseAdmin
      .from('agents')
      .update(updateData)
      .eq('agent_id', userId)

    if (updateError) {
      console.error('Error updating agent metrics:', updateError)
    } else {
      console.log('✅ Agent metrics updated:', {
        agentId: userId,
        total_listings: updateData.total_listings,
        active_listings: updateData.active_listings,
        estimated_revenue: updateData.estimated_revenue,
        total_commission: updateData.total_commission
      })
    }
  } catch (error) {
    console.error('Error in updateAgentAfterListing:', error)
    console.error('Error stack:', error.stack)
  }
}

// Helper function to recalculate and update agency metrics from all agent listings
async function updateAgencyAfterListing(agencyId, operation = 'update') {
  if (!agencyId) return

  try {
    console.log('🔄 Recalculating agency metrics for agency:', agencyId, 'operation:', operation)
    
    // Get agency record
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id, agency_id, total_listings, estimated_revenue, agents_total_revenue, agents_total_sales')
      .eq('agency_id', agencyId)
      .single()

    if (agencyError || !agency) {
      console.error('Error fetching agency:', agencyError)
      return
    }

    // Get all agents in this agency
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('agent_id')
      .eq('agency_id', agencyId)
      .eq('account_status', 'active')

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
      return
    }

    if (!agents || agents.length === 0) {
      // No agents, reset agency metrics
      const { error: updateError } = await supabaseAdmin
        .from('agencies')
        .update({
          total_listings: 0,
          estimated_revenue: '0.00',
          agents_total_revenue: '0.00',
          agents_total_sales: 0
        })
        .eq('agency_id', agencyId)
      
      if (updateError) {
        console.error('Error resetting agency metrics:', updateError)
      }
      return
    }

    const agentIds = agents.map(agent => agent.agent_id)

    // Recalculate total_listings from all agent listings
    const { count: totalListingsCount, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .in('user_id', agentIds)
      .eq('account_type', 'agent')
      .in('listing_status', ['active', 'sold', 'rented', 'draft'])

    if (listingsError) {
      console.error('Error counting listings:', listingsError)
    }

    // Recalculate estimated_revenue from all agent listings
    const { data: allListings, error: allError } = await supabaseAdmin
      .from('listings')
      .select('estimated_revenue, listing_status')
      .in('user_id', agentIds)
      .eq('account_type', 'agent')
      .in('listing_status', ['active', 'sold', 'rented'])

    let totalEstimatedRevenue = 0

    if (!allError && allListings) {
      allListings.forEach(listing => {
        if (listing.estimated_revenue) {
          let revenueValue = 0
          if (typeof listing.estimated_revenue === 'object') {
            revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
          } else if (typeof listing.estimated_revenue === 'number') {
            revenueValue = listing.estimated_revenue
          } else if (typeof listing.estimated_revenue === 'string') {
            revenueValue = parseFloat(listing.estimated_revenue) || 0
          }
          
          if (revenueValue > 0) {
            totalEstimatedRevenue += revenueValue
          }
        }
      })
    }

    // Recalculate agents_total_revenue and agents_total_sales from sales_listings
    const { data: salesListings, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_price')
      .in('user_id', agentIds)

    let agentsTotalRevenue = 0
    let agentsTotalSales = 0

    if (!salesError && salesListings) {
      agentsTotalSales = salesListings.length
      salesListings.forEach(sale => {
        const salePrice = typeof sale.sale_price === 'string' 
          ? parseFloat(sale.sale_price) 
          : (sale.sale_price || 0)
        if (typeof salePrice === 'number' && salePrice > 0) {
          agentsTotalRevenue += salePrice
        }
      })
    }

    // Update agency table
    const updateData = {
      total_listings: totalListingsCount || 0,
      estimated_revenue: totalEstimatedRevenue.toFixed(2),
      agents_total_revenue: agentsTotalRevenue.toFixed(2),
      agents_total_sales: agentsTotalSales
    }

    const { error: updateError } = await supabaseAdmin
      .from('agencies')
      .update(updateData)
      .eq('agency_id', agencyId)

    if (updateError) {
      console.error('Error updating agency metrics:', updateError)
    } else {
      console.log('✅ Agency metrics updated:', {
        agencyId: agencyId,
        total_listings: updateData.total_listings,
        estimated_revenue: updateData.estimated_revenue,
        agents_total_revenue: updateData.agents_total_revenue,
        agents_total_sales: updateData.agents_total_sales
      })
    }
  } catch (error) {
    console.error('Error in updateAgencyAfterListing:', error)
    console.error('Error stack:', error.stack)
  }
}

// Helper function to get developer's primary currency
async function getDeveloperPrimaryCurrency(userId) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('developers')
      .select('company_locations, default_currency')
      .eq('developer_id', userId)
      .single()

    if (error || !profile) {
      console.error('Error fetching developer currency:', error)
      return 'USD'
    }

    if (profile.company_locations && Array.isArray(profile.company_locations)) {
      const primaryLocation = profile.company_locations.find(
        loc => loc.primary_location === true || loc.primary_location === 'true'
      )
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }

    if (profile.default_currency) {
      let defaultCurrency = profile.default_currency
      if (typeof defaultCurrency === 'string') {
        try {
          defaultCurrency = JSON.parse(defaultCurrency)
        } catch (e) {
        }
      }
      if (defaultCurrency?.code) {
        return defaultCurrency.code
      }
    }

    return 'USD'
  } catch (error) {
    console.error('Error in getDeveloperPrimaryCurrency:', error)
    return 'USD'
  }
}

// Helper function to check if listing already sold
async function checkListingAlreadySold(listingId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sales_listings')
      .select('id')
      .eq('listing_id', listingId)
      .maybeSingle()

    if (error) {
      console.error('Error checking sales_listings:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in checkListingAlreadySold:', error)
    return false
  }
}

// Helper function to update total_revenue for developer and development
async function updateTotalRevenue(userId, developmentId, estimatedRevenue, operation = 'add') {
  try {
    const currencyResult = await getDeveloperPrimaryCurrency(userId)
    if (currencyResult.error) {
      return { error: currencyResult.error, requiresCurrencySetup: currencyResult.requiresCurrencySetup }
    }
    const primaryCurrency = currencyResult.currency
    
    // Get revenue value - use estimated_revenue.estimated_revenue (user's primary currency)
    const revenueValue = estimatedRevenue?.estimated_revenue || estimatedRevenue?.price || 0
    const revenueValueNum = typeof revenueValue === 'string' ? parseFloat(revenueValue) : (typeof revenueValue === 'number' ? revenueValue : 0)
    
    console.log('💰 updateTotalRevenue called:', {
      userId,
      developmentId,
      operation,
      primaryCurrency,
      revenueValue: revenueValueNum,
      estimatedRevenue: JSON.stringify(estimatedRevenue)
    })
    
    if (!revenueValueNum || revenueValueNum <= 0) {
      console.log('⚠️ No revenue value to update (value is 0 or invalid)')
      return { success: true }
    }

    if (userId) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('total_revenue, total_sales, developer_id')
        .eq('developer_id', userId)
        .single()

      if (devError) {
        console.error('❌ Error fetching developer:', devError)
        return
      }

      if (developer) {
        // total_revenue is NUMERIC, handle both number and string
        let currentRevenue = 0
        if (developer.total_revenue !== null && developer.total_revenue !== undefined) {
          if (typeof developer.total_revenue === 'number') {
            currentRevenue = developer.total_revenue
          } else if (typeof developer.total_revenue === 'string') {
            currentRevenue = parseFloat(developer.total_revenue) || 0
          } else if (typeof developer.total_revenue === 'object' && developer.total_revenue?.total_revenue) {
            currentRevenue = parseFloat(developer.total_revenue.total_revenue) || 0
          }
        }
        
        let newTotalRevenue = currentRevenue || 0
        
        if (operation === 'add') {
          newTotalRevenue = (currentRevenue || 0) + revenueValueNum
        } else if (operation === 'subtract') {
          newTotalRevenue = Math.max(0, (currentRevenue || 0) - revenueValueNum)
        }

        // Get current total_sales
        const currentTotalSales = developer.total_sales || 0
        let newTotalSales = currentTotalSales
        
        // Increment total_sales when adding revenue (new sale)
        if (operation === 'add') {
          newTotalSales = (currentTotalSales || 0) + 1
        } else if (operation === 'subtract') {
          // Decrement when removing revenue (sale reversed)
          newTotalSales = Math.max(0, (currentTotalSales || 0) - 1)
        }

        console.log('📊 Updating developer revenue:', {
          developer_id: developer.developer_id,
          currentRevenue,
          revenueValueNum,
          newTotalRevenue,
          currentTotalSales,
          newTotalSales,
          operation
        })

        const { error: updateError } = await supabaseAdmin
          .from('developers')
          .update({
            total_revenue: newTotalRevenue, // NUMERIC field - keep as decimal
            total_sales: newTotalSales
          })
          .eq('developer_id', userId)

        if (updateError) {
          console.error('❌ Error updating developer total_revenue and total_sales:', updateError)
        } else {
          console.log('✅ Successfully updated developer total_revenue:', {
            developer_id: developer.developer_id,
            total_revenue: newTotalRevenue,
            total_sales: newTotalSales
          })
        }
      } else {
        console.error('❌ Developer not found for userId:', userId)
      }
    }

    if (developmentId) {
      const { data: development, error: devError } = await supabaseAdmin
        .from('developments')
        .select('total_revenue, units_sold')
        .eq('id', developmentId)
        .single()

      if (!devError && development) {
        // total_revenue might be INTEGER or JSONB, handle both
        const currentRevenue = typeof development.total_revenue === 'number'
          ? development.total_revenue
          : (typeof development.total_revenue === 'object' && development.total_revenue?.total_revenue
              ? development.total_revenue.total_revenue
              : 0)
        
        let newTotalRevenue = currentRevenue || 0
        
        if (operation === 'add') {
          newTotalRevenue = (newTotalRevenue || 0) + revenueValue
        } else if (operation === 'subtract') {
          newTotalRevenue = Math.max(0, (newTotalRevenue || 0) - revenueValue)
        }

        // Update units_sold
        const currentUnitsSold = development.units_sold || 0
        let newUnitsSold = currentUnitsSold
        
        if (operation === 'add') {
          newUnitsSold = (currentUnitsSold || 0) + 1
        } else if (operation === 'subtract') {
          newUnitsSold = Math.max(0, (currentUnitsSold || 0) - 1)
        }

        console.log('📊 Updating development revenue:', {
          developmentId,
          currentRevenue,
          revenueValueNum,
          newTotalRevenue,
          currentUnitsSold,
          newUnitsSold,
          operation
        })

        const { error: updateError } = await supabaseAdmin
          .from('developments')
          .update({
            total_revenue: newTotalRevenue, // NUMERIC field - keep as decimal
            units_sold: newUnitsSold
          })
          .eq('id', developmentId)

        if (updateError) {
          console.error('❌ Error updating development total_revenue and units_sold:', updateError)
        } else {
          console.log('✅ Successfully updated development total_revenue:', {
            developmentId,
            total_revenue: newTotalRevenue,
            units_sold: newUnitsSold
          })
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateTotalRevenue:', error)
    return { error: 'Error updating revenue. Please try again.' }
  }
}

// Helper function to create sales_listings entry
async function createSalesListingEntry(listingId, userId, listingData, saleType, salesInfo = {}) {
  try {
    // Get primary currency based on account type
    let primaryCurrency = null
    let currencyError = null
    
    if (listingData.account_type === 'developer') {
      const currencyResult = await getDeveloperPrimaryCurrency(userId)
      if (currencyResult.error) {
        return { error: currencyResult.error, requiresCurrencySetup: currencyResult.requiresCurrencySetup }
      }
      primaryCurrency = currencyResult.currency
    } else if (listingData.account_type === 'agent') {
      // Get agency's default currency
      const { data: agent } = await supabaseAdmin
        .from('agents')
        .select('agency_id')
        .eq('agent_id', userId)
        .single()
      
      if (agent?.agency_id) {
        const { data: agency } = await supabaseAdmin
          .from('agencies')
          .select('default_currency, company_locations, name')
          .eq('agency_id', agent.agency_id)
          .single()
        
        if (agency?.default_currency) {
          primaryCurrency = agency.default_currency
        } else if (agency?.company_locations) {
          // Try to get currency from primary location
          const locations = Array.isArray(agency.company_locations) 
            ? agency.company_locations 
            : (typeof agency.company_locations === 'string' ? JSON.parse(agency.company_locations) : [])
          const primaryLocation = locations.find(loc => loc.primary_location === true)
          if (primaryLocation?.currency) {
            primaryCurrency = primaryLocation.currency
          }
        }
        
        // If still no currency found, return error
        if (!primaryCurrency) {
          return { 
            error: `Please set your agency's default currency in your agency profile settings. Go to your agency profile and set a default currency.`,
            requiresCurrencySetup: true
          }
        }
      } else {
        return { 
          error: 'Agent agency not found. Please contact support.',
          requiresCurrencySetup: false
        }
      }
    } else {
      primaryCurrency = 'GHS' // Default fallback
    }
    
    const estimatedRevenue = listingData.estimated_revenue || {}
    const salePrice = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
    
    if (!salePrice || salePrice <= 0) {
      console.error('No sale price available for sales_listings entry')
      return { error: 'No sale price available for this listing.' }
    }

    // Calculate commission for agents
    let commissionRate = null
    let commissionAmount = null
    if (listingData.account_type === 'agent' && listingData.commission_rate) {
      commissionRate = listingData.commission_rate
      const percentage = commissionRate.percentage || 0
      commissionAmount = (salePrice * percentage) / 100
    }

    const salesEntry = {
      listing_id: listingId,
      user_id: userId || null,
      sale_price: parseFloat(salePrice.toFixed(2)),
      currency: primaryCurrency,
      sale_type: saleType,
      sale_date: new Date().toISOString().split('T')[0],
      sale_timestamp: new Date().toISOString(),
      sale_source: salesInfo.sale_source || 'Iska Homes',
      buyer_name: salesInfo.buyer_name || null,
      notes: salesInfo.notes || null,
      commission_rate: commissionRate,
      commission_amount: commissionAmount ? parseFloat(commissionAmount.toFixed(2)) : null
    }

    const { data, error } = await supabaseAdmin
      .from('sales_listings')
      .insert([salesEntry])
      .select()
      .single()

    if (error) {
      console.error('Error creating sales_listings entry:', error)
      return { error: 'Failed to create sales entry. Please try again.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createSalesListingEntry:', error)
    return { error: 'Error creating sales entry. Please try again.' }
  }
}

// Helper to upload a single file
async function uploadFile(file, folder, subfolder) {
  try {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('iskaHomes')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('iskaHomes')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
      filename: fileName,
      originalName: file.name
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

// ============================================================================
// MAIN HANDLER FUNCTION
// ============================================================================

export async function handleStepUpdate(request, params, isNewListing) {
  try {
    const resolvedParams = await params
    const stepName = resolvedParams.stepName
    const id = resolvedParams.id || null // id might be 'new' for new listings

    if (!stepName) {
      return NextResponse.json(
        { error: 'Step name is required' },
        { status: 400 }
      )
    }

    // Determine if this is actually a new listing
    const actuallyNewListing = isNewListing || id === 'new' || !id

    // For updates, id must exist
    if (!actuallyNewListing && !id) {
      return NextResponse.json(
        { error: 'Listing ID is required for updates' },
        { status: 400 }
      )
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.user_id
    const accountType = decoded.user_type || 'developer'

    // Parse form data first (can only be read once)
    const formData = await request.formData()
    const stepData = formData.get('data') ? JSON.parse(formData.get('data')) : {}

    let existingListing = null

    // For updates, check if listing exists
    if (!actuallyNewListing && id && id !== 'new') {
      // Helper function to check if a string is a valid UUID
      const isUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }
      
      // Determine if id is a UUID or slug
      const isIdUUID = isUUID(id)
      
      // Build query - try by ID if it's a UUID, otherwise by slug
      let query = supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
      
      if (isIdUUID) {
        query = query.eq('id', id)
      } else {
        query = query.eq('slug', id)
      }
      
      const { data: listing, error: fetchError } = await query.single()

      if (fetchError || !listing) {
        return NextResponse.json(
          { error: 'Listing not found or access denied' },
          { status: 404 }
        )
      }
      existingListing = listing
      
      // Use the actual listing ID (UUID) for all operations
      const actualListingId = listing.id
    } else if (actuallyNewListing) {
      // For developer accounts, get development_id from stepData if available (basic-info step)
      let developmentId = null
      if (accountType === 'developer' && stepName === 'basic-info' && stepData.development_id) {
        developmentId = stepData.development_id || null
      }
      
      // For developer accounts, if development_id is not provided, try to get the first development
      if (accountType === 'developer' && !developmentId) {
        // Get developer's first development
        const { data: developer } = await supabaseAdmin
          .from('developers')
          .select('id')
          .eq('developer_id', userId)
          .single()
        
        if (developer) {
          const { data: firstDevelopment } = await supabaseAdmin
            .from('developments')
            .select('id')
            .eq('developer_id', developer.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()
          
          if (firstDevelopment) {
            developmentId = firstDevelopment.id
          } else {
            // No developments found - return error
            return NextResponse.json(
              { error: 'No development found. Please create a development first before adding listings.' },
              { status: 400 }
            )
          }
        }
      }
      
      // For new listings, create a draft first if it doesn't exist
      // Check if draft exists
      const { data: draftListing } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .eq('listing_status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (draftListing) {
        existingListing = draftListing
      } else {
        // Get agency_id for agents
        let agencyId = null
        if (accountType === 'agent') {
          const { data: agent, error: agentError } = await supabaseAdmin
            .from('agents')
            .select('agency_id')
            .eq('agent_id', userId)
            .single()
          
          if (!agentError && agent?.agency_id) {
            agencyId = agent.agency_id
          } else {
            console.warn('⚠️ Agent not found or agency_id missing for user:', userId)
          }
        }
        
        // Create new draft listing
        // For developer accounts, development_id is required by constraint
        const draftTitle = 'Draft Listing'
        // Generate slug for draft listing
        let draftSlug = null
        const baseDraftSlug = generateSlug(draftTitle)
        if (baseDraftSlug) {
          // Use timestamp to make draft slug unique
          draftSlug = `${baseDraftSlug}-${Date.now()}`
        }
        
        const draftData = {
          account_type: accountType,
          user_id: userId,
          created_by: userId, // Required field - set to the user creating the listing
          last_modified_by: userId, // Set to the user creating the listing
          listing_type: accountType === 'developer' ? 'unit' : 'property',
          listing_status: 'draft', // Default is 'draft', but set explicitly for clarity
          listing_condition: 'adding', // Default is 'adding', but set explicitly for clarity
          upload_status: 'incomplete', // Default is 'incomplete', but set explicitly for clarity
          title: draftTitle,
          description: '',
          status: 'Available',
          slug: draftSlug // Generate slug even for draft
        }
        
        // Add development_id if it's a developer account (required by constraint)
        if (accountType === 'developer') {
          if (developmentId) {
            draftData.development_id = developmentId
          } else {
            // This should not happen if the code above worked, but just in case
            return NextResponse.json(
              { error: 'Development ID is required for developer listings. Please select a development first.' },
              { status: 400 }
            )
          }
        }
        
        // Add listing_agency_id if it's an agent account
        if (accountType === 'agent' && agencyId) {
          draftData.listing_agency_id = agencyId
        }
        
        const { data: newDraft, error: createError } = await supabase
          .from('listings')
          .insert([draftData])
          .select()
          .single()

        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create draft listing', details: createError.message },
            { status: 500 }
          )
        }
        existingListing = newDraft
      }
    }

    // Prepare update data based on step
    let updateData = {}
    let needsCurrencyConversion = false

    switch (stepName) {
      case 'basic-info':
        // For new listings, always keep listing_status as 'draft'
        // For existing listings, only change if explicitly provided, otherwise keep current status
        let newListingStatus
        if (actuallyNewListing) {
          // Always 'draft' for new listings - only changes when finalized via preview
          newListingStatus = 'draft'
        } else {
          // For existing listings, only update if explicitly provided in stepData
          // Otherwise preserve the current listing_status
          newListingStatus = stepData.listing_status !== undefined 
            ? stepData.listing_status 
            : existingListing.listing_status
        }
        
        // Get agency_id for agents - always fetch and set if agent has an agency
        let agencyId = existingListing.listing_agency_id
        if (accountType === 'agent') {
          // Always fetch agency_id to ensure it's set, even if listing already has it
          // This ensures listings always have the correct agency_id
          const { data: agent, error: agentError } = await supabaseAdmin
            .from('agents')
            .select('agency_id')
            .eq('agent_id', userId)
            .single()
          
          if (!agentError && agent?.agency_id) {
            agencyId = agent.agency_id
          } else if (!agencyId) {
            console.warn('⚠️ Agent not found or agency_id missing for user:', userId)
          }
        }
        
        // Generate slug from title if title is provided and slug doesn't exist
        let slugToUse = existingListing.slug
        const titleToUse = stepData.title || existingListing.title
        if (titleToUse && (!existingListing.slug || existingListing.slug === '')) {
          // Generate slug from title
          const baseSlug = generateSlug(titleToUse)
          if (baseSlug) {
            slugToUse = await generateUniqueSlug(baseSlug, existingListing.id)
          }
        } else if (titleToUse && stepData.title && stepData.title !== existingListing.title) {
          // Title changed, regenerate slug
          const baseSlug = generateSlug(stepData.title)
          if (baseSlug) {
            slugToUse = await generateUniqueSlug(baseSlug, existingListing.id)
          }
        }
        
        updateData = {
          title: stepData.title || existingListing.title,
          description: stepData.description || existingListing.description,
          size: stepData.size || existingListing.size,
          status: stepData.status || existingListing.status,
          listing_type: stepData.listing_type || existingListing.listing_type,
          listing_status: newListingStatus,
          development_id: stepData.development_id !== undefined 
            ? (stepData.development_id || null) 
            : existingListing.development_id,
          // Set listing_agency_id for agents
          listing_agency_id: accountType === 'agent' && agencyId ? agencyId : existingListing.listing_agency_id,
          // Set slug if generated
          slug: slugToUse || existingListing.slug
        }
        break

      case 'categories':
        updateData = {
          purposes: stepData.purposes || existingListing.purposes || [],
          types: stepData.types || existingListing.types || [],
          categories: stepData.categories || existingListing.categories || [],
          listing_types: stepData.listing_types || existingListing.listing_types || {
            database: [],
            inbuilt: [],
            custom: []
          }
        }
        break

      case 'specifications':
        updateData = {
          specifications: stepData.specifications || existingListing.specifications || {}
        }
        break

      case 'location':
        updateData = {
          country: stepData.country || existingListing.country,
          state: stepData.state || existingListing.state,
          city: stepData.city || existingListing.city,
          town: stepData.town || existingListing.town,
          full_address: stepData.full_address || existingListing.full_address,
          latitude: stepData.latitude || existingListing.latitude,
          longitude: stepData.longitude || existingListing.longitude,
          location_additional_information: stepData.location_additional_information || existingListing.location_additional_information
        }
        break

      case 'pricing':
        // Handle pricing update
        const pricingData = stepData.pricing || {}
        
        // Check if status field indicates sold/rented/taken and map to listing_status
        const currentStatus = existingListing.status || ''
        const mappedListingStatus = mapStatusToListingStatus(currentStatus)
        
        updateData = {
          pricing: {
            price: pricingData.price || existingListing.pricing?.price || '',
            currency: pricingData.currency || existingListing.pricing?.currency || 'GHS',
            duration: pricingData.duration || existingListing.pricing?.duration || 'monthly',
            price_type: pricingData.price_type || existingListing.pricing?.price_type || 'rent',
            security_requirements: pricingData.security_requirements || existingListing.pricing?.security_requirements || '',
            time: pricingData.time || existingListing.pricing?.time || '',
            ideal_duration: pricingData.ideal_duration || existingListing.pricing?.ideal_duration || '',
            time_span: pricingData.time_span || existingListing.pricing?.time_span || 'months'
          },
          // Keep separate columns for backwards compatibility
          price: pricingData.price || existingListing.price || '',
          currency: pricingData.currency || existingListing.currency || 'GHS',
          duration: pricingData.duration || existingListing.duration || 'monthly',
          price_type: pricingData.price_type || existingListing.price_type || 'rent',
          cancellation_policy: pricingData.cancellation_policy || existingListing.cancellation_policy || '',
          is_negotiable: pricingData.is_negotiable !== undefined ? pricingData.is_negotiable : existingListing.is_negotiable,
          security_requirements: pricingData.security_requirements || existingListing.security_requirements || '',
          flexible_terms: pricingData.flexible_terms !== undefined ? pricingData.flexible_terms : existingListing.flexible_terms,
          available_from: pricingData.available_from || existingListing.available_from,
          available_until: pricingData.available_until || existingListing.available_until,
          acquisition_rules: pricingData.acquisition_rules || existingListing.acquisition_rules,
          // Agent-specific fields
          commission_rate: stepData.commission_rate || existingListing.commission_rate || null,
          listing_agency_id: existingListing.listing_agency_id || null
        }
        
        // If status indicates sold/rented/taken, update listing_status
        // If status is NOT sold/rented/taken, reset listing_status to 'active' (if it was previously sold/rented)
        if (mappedListingStatus) {
          updateData.listing_status = mappedListingStatus
        } else if (isStatusSoldRentedOrTaken(existingListing.status || '')) {
          // Status changed from sold/rented/taken to something else, reset to active
          const currentListingStatus = existingListing.listing_status || 'active'
          if (['sold', 'rented'].includes(currentListingStatus?.toLowerCase())) {
            updateData.listing_status = 'active'
          }
        }
        
        needsCurrencyConversion = true
        break

      case 'amenities':
        updateData = {
          amenities: {
            inbuilt: stepData.amenities?.inbuilt || existingListing.amenities?.inbuilt || [],
            custom: stepData.amenities?.custom || existingListing.amenities?.custom || []
          }
        }
        break

      case 'social-amenities':
        // Social amenities are stored in a separate table, not in listings table
        // So we don't update the listings table for this step
        updateData = {}
        break

      case 'media':
        // Handle media uploads
        const existingMedia = existingListing.media || { albums: [], video: null, youtubeUrl: '', virtualTourUrl: '' }
        const formMedia = stepData.media || {}
        
        // Handle new image uploads
        const albumFilesMap = {}
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('album_') && value instanceof File) {
            const match = key.match(/album_(\d+)_image_(\d+)/)
            if (match) {
              const albumIndex = parseInt(match[1])
              if (!albumFilesMap[albumIndex]) {
                albumFilesMap[albumIndex] = []
              }
              albumFilesMap[albumIndex].push(value)
            }
          }
        }

        // Upload new images
        const uploadedImages = []
        for (const [albumIndex, files] of Object.entries(albumFilesMap)) {
          for (const file of files) {
            try {
              const uploaded = await uploadFile(file, 'iskaHomes', 'property-media')
              uploadedImages.push({ ...uploaded, albumIndex: parseInt(albumIndex) })
            } catch (error) {
              console.error('Error uploading image:', error)
            }
          }
        }

        // Merge albums structure
        let albums = Array.isArray(formMedia.albums) ? formMedia.albums : (existingMedia.albums || [])
        
        // Add uploaded images to their albums
        uploadedImages.forEach(({ albumIndex, ...imageData }) => {
          if (albums[albumIndex]) {
            if (!albums[albumIndex].images) {
              albums[albumIndex].images = []
            }
            albums[albumIndex].images.push({
              id: `img_${albums[albumIndex].images.length + 1}_${id}`,
              ...imageData,
              created_at: new Date().toISOString()
            })
          }
        })

        // Handle video upload
        let videoData = existingMedia.video
        const videoFile = formData.get('video')
        if (videoFile && videoFile instanceof File) {
          try {
            videoData = await uploadFile(videoFile, 'iskaHomes', 'property-media')
          } catch (error) {
            console.error('Error uploading video:', error)
          }
        }

        updateData = {
          media: {
            ...existingMedia,
            ...formMedia,
            albums: albums,
            video: videoData || formMedia.video || existingMedia.video,
            youtubeUrl: formMedia.youtubeUrl !== undefined ? formMedia.youtubeUrl : existingMedia.youtubeUrl,
            virtualTourUrl: formMedia.virtualTourUrl !== undefined ? formMedia.virtualTourUrl : existingMedia.virtualTourUrl
          }
        }
        break

      case 'immersive-experience':
        // Handle 3D model and virtual tour
        let model3dData = existingListing['3d_model']
        const model3dFile = formData.get('model3d')
        if (model3dFile && model3dFile instanceof File) {
          try {
            model3dData = await uploadFile(model3dFile, 'iskaHomes', '3d-models')
          } catch (error) {
            console.error('Error uploading 3D model:', error)
          }
        }

        updateData = {
          '3d_model': model3dData || stepData.model_3d || existingListing['3d_model'],
          virtual_tour_link: stepData.virtual_tour_link || existingListing.virtual_tour_link
        }
        break

      case 'additional-info':
        // Handle floor plan and additional files
        let floorPlanData = existingListing.floor_plan
        const floorPlanFile = formData.get('floorPlan')
        if (floorPlanFile && floorPlanFile instanceof File) {
          try {
            floorPlanData = await uploadFile(floorPlanFile, 'iskaHomes', 'property-media')
          } catch (error) {
            console.error('Error uploading floor plan:', error)
          }
        }

        // Handle additional files
        const additionalFiles = []
        for (let i = 0; i < 10; i++) {
          const file = formData.get(`additionalFile_${i}`)
          if (file && file instanceof File) {
            try {
              const uploaded = await uploadFile(file, 'iskaHomes', 'property-files')
              additionalFiles.push(uploaded)
            } catch (error) {
              console.error(`Error uploading additional file ${i}:`, error)
            }
        }
        }

        const existingAdditionalFiles = existingListing.additional_files || []
        updateData = {
          additional_information: stepData.additional_information || existingListing.additional_information,
          floor_plan: floorPlanData || stepData.floor_plan || existingListing.floor_plan,
          additional_files: [...existingAdditionalFiles, ...additionalFiles]
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown step: ${stepName}` },
          { status: 400 }
        )
    }

    // Process currency conversions if pricing step
    if (needsCurrencyConversion && updateData.pricing && updateData.pricing.price) {
      try {
        // Parse price - handle both string and number
        const priceValue = typeof updateData.pricing.price === 'string' 
          ? parseFloat(updateData.pricing.price) 
          : updateData.pricing.price
        
        // Parse ideal_duration - handle empty string, null, or undefined
        let idealDurationValue = null
        if (updateData.pricing.ideal_duration) {
          const parsed = parseFloat(updateData.pricing.ideal_duration)
          idealDurationValue = isNaN(parsed) ? null : parsed
        }
        
        console.log('🔄 Processing currency conversion:', {
          price: priceValue,
          currency: updateData.pricing.currency,
          priceType: updateData.pricing.price_type,
          idealDuration: idealDurationValue,
          timeSpan: updateData.pricing.time_span,
          userId: userId,
          accountType: existingListing.account_type
        })
        
        const conversions = await processCurrencyConversions({
          price: priceValue,
          currency: updateData.pricing.currency || 'GHS',
          priceType: updateData.pricing.price_type || 'rent',
          idealDuration: idealDurationValue,
          timeSpan: updateData.pricing.time_span || 'months',
          userId: userId,
          accountType: existingListing.account_type || 'developer'
        })
        
        console.log('✅ Currency conversion result:', {
          estimated_revenue: conversions.estimated_revenue,
          global_price: conversions.global_price
        })
        
        // Ensure we have valid conversion results
        if (conversions.estimated_revenue && Object.keys(conversions.estimated_revenue).length > 0) {
          updateData.estimated_revenue = conversions.estimated_revenue
        } else {
          console.warn('⚠️ estimated_revenue is empty, conversion may have failed')
        }
        
        if (conversions.global_price && Object.keys(conversions.global_price).length > 0) {
          updateData.global_price = conversions.global_price
        } else {
          console.warn('⚠️ global_price is empty, conversion may have failed')
        }
      } catch (conversionError) {
        console.error('❌ Error processing currency conversions:', conversionError)
        console.error('❌ Error stack:', conversionError.stack)
        console.error('❌ Conversion input:', {
          price: updateData.pricing.price,
          currency: updateData.pricing.currency,
          priceType: updateData.pricing.price_type,
          idealDuration: updateData.pricing.ideal_duration,
          timeSpan: updateData.pricing.time_span,
          userId: userId,
          accountType: existingListing.account_type
        })
        // Don't set empty objects - let the database keep existing values
        // This way we don't overwrite valid data with empty objects
      }
    }

    // Update or create the listing (only if updateData is not empty)
    // Always use the actual listing ID (UUID) from existingListing, never the slug/id parameter
    const listingId = existingListing?.id
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID not found' },
        { status: 400 }
      )
    }
    let updatedListing = existingListing
    
    // Only update listings table if there's data to update (social-amenities is handled separately)
    if (Object.keys(updateData).length > 0) {
      const { data: listingData, error: updateError } = await supabase
        .from('listings')
        .update({
          ...updateData,
          last_modified_by: userId
        })
        .eq('id', listingId)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating listing step:', updateError)
        return NextResponse.json(
          { error: 'Failed to update listing step', details: updateError.message },
          { status: 500 }
        )
      }
      updatedListing = listingData
    } else if (stepName === 'social-amenities') {
      // For social-amenities, we still need to update last_modified_by
      const { data: listingData, error: updateError } = await supabase
        .from('listings')
        .update({
          last_modified_by: userId
        })
        .eq('id', listingId)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating listing last_modified_by:', updateError)
        // Don't fail - social amenities update is more important
      } else {
        updatedListing = listingData
      }
    }

    // Handle social amenities separately (stored in different table)
    if (stepName === 'social-amenities' && stepData.social_amenities) {
      try {
        // Helper function to download image from URL and upload to Supabase
        const downloadAndUploadImage = async (imageUrl, folder, subfolder, fileName) => {
          try {
            const response = await fetch(imageUrl)
            if (!response.ok) {
              throw new Error(`Failed to download image: ${response.statusText}`)
            }
            
            const imageBuffer = await response.arrayBuffer()
            const contentType = response.headers.get('content-type') || 'image/jpeg'
            
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(2, 15)
            const fileExtension = fileName?.split('.').pop() || contentType.split('/')[1] || 'jpg'
            const finalFileName = fileName || `${timestamp}_${randomString}.${fileExtension}`
            const filePath = `${folder}/${subfolder}/${finalFileName}`
            
            const { data, error } = await supabaseAdmin.storage
              .from('iskaHomes')
              .upload(filePath, imageBuffer, {
                contentType: contentType,
                cacheControl: '3600',
                upsert: false
              })
            
            if (error) {
              console.error('Storage error:', error)
              throw new Error(`Failed to upload image: ${error.message}`)
            }
            
            const { data: urlData } = supabaseAdmin.storage
              .from('iskaHomes')
              .getPublicUrl(filePath)
            
            return urlData.publicUrl
          } catch (error) {
            console.error('Image download/upload error:', error)
            throw error
          }
        }
        
        // Process each amenity category and download/store images
        const processedAmenities = {}
        const amenityCategories = ['schools', 'hospitals', 'airports', 'parks', 'shops', 'police']
        
        for (const category of amenityCategories) {
          const categoryAmenities = stepData.social_amenities[category] || []
          processedAmenities[category] = await Promise.all(
            categoryAmenities.map(async (amenity) => {
              const processedAmenity = { ...amenity }
              
              // Download and store image if photoUrl exists and database_url doesn't exist
              if (!amenity.database_url && (amenity.photoUrl || amenity.photos?.[0]?.url)) {
                try {
                  const imageUrl = amenity.photoUrl || amenity.photos?.[0]?.url
                  const fileName = `${amenity.id || 'amenity'}_${Date.now()}.jpg`
                    .replace(/[^a-zA-Z0-9._-]/g, '_')
                  
                  const databaseUrl = await downloadAndUploadImage(
                    imageUrl,
                    'iskaHomes',
                    'social-amenities',
                    fileName
                  )
                  
                  processedAmenity.database_url = databaseUrl
                } catch (imageError) {
                  console.error(`Error processing image for amenity ${amenity.id}:`, imageError)
                  processedAmenity.database_url = amenity.database_url || null
                }
              } else {
                // Keep existing database_url if it exists
                processedAmenity.database_url = amenity.database_url || null
              }
              
              return processedAmenity
            })
          )
        }

        const { data: existingSocialAmenities } = await supabaseAdmin
          .from('social_amenities')
          .select('id')
          .eq('listing_id', listingId)
          .single()

        const amenitiesPayload = {
          listing_id: listingId,
          schools: processedAmenities.schools || [],
          hospitals: processedAmenities.hospitals || [],
          airports: processedAmenities.airports || [],
          parks: processedAmenities.parks || [],
          shops: processedAmenities.shops || [],
          police: processedAmenities.police || []
        }

        if (existingSocialAmenities) {
          await supabaseAdmin
            .from('social_amenities')
            .update(amenitiesPayload)
            .eq('listing_id', listingId)
        } else {
          await supabaseAdmin
            .from('social_amenities')
            .insert([amenitiesPayload])
        }
      } catch (socialAmenitiesError) {
        console.error('Error updating social amenities:', socialAmenitiesError)
        // Don't fail the request if social amenities fail
      }
    }

    // ============================================================================
    // ANALYTICS AND STATS UPDATES (after listing update)
    // ============================================================================
    
    // Get the latest listing data for analytics
    const { data: latestListing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (latestListing) {
      updatedListing = latestListing

      // 1. Handle status changes to sold/rented/taken - update total_revenue, sales_listings, and admin_sales_analytics
      if (latestListing.account_type === 'developer' && !actuallyNewListing) {
        const oldListingStatus = existingListing.listing_status || 'active'
        const newListingStatus = latestListing.listing_status || oldListingStatus
        
        // Also check the status field for Sold, Rented Out, or Taken
        const oldStatus = existingListing.status || ''
        const newStatus = latestListing.status || oldStatus
        const oldStatusIndicatesSoldRentedOrTaken = isStatusSoldRentedOrTaken(oldStatus)
        const newStatusIndicatesSoldRentedOrTaken = isStatusSoldRentedOrTaken(newStatus)
        
        // Check both listing_status and status field
        const isSoldOrRented = ['sold', 'rented'].includes(newListingStatus?.toLowerCase()) || newStatusIndicatesSoldRentedOrTaken
        const wasSoldOrRented = ['sold', 'rented'].includes(oldListingStatus?.toLowerCase()) || oldStatusIndicatesSoldRentedOrTaken
        const statusChangedToSoldOrRented = isSoldOrRented && !wasSoldOrRented
        const statusChangedFromSoldOrRentedToAvailable = wasSoldOrRented && !isSoldOrRented
        const statusChangedFromRentedToSold = (oldListingStatus?.toLowerCase() === 'rented' || oldStatus?.toLowerCase() === 'rented out') && 
                                               (newListingStatus?.toLowerCase() === 'sold' || newStatus?.toLowerCase() === 'sold')

        if (statusChangedToSoldOrRented) {
          const alreadySold = await checkListingAlreadySold(listingId)
          if (!alreadySold) {
            const estimatedRevenue = latestListing.estimated_revenue || existingListing.estimated_revenue || {}
            const revenueValue = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
            
            if (revenueValue > 0) {
              // Determine sale type from listing_status or status field
              let saleType = 'sold' // default
              if (newListingStatus?.toLowerCase() === 'rented' || newStatus?.toLowerCase() === 'rented out') {
                saleType = 'rented'
              } else if (newListingStatus?.toLowerCase() === 'sold' || newStatus?.toLowerCase() === 'sold') {
                saleType = 'sold'
              } else if (newListingStatus?.toLowerCase() === 'taken' || newStatus?.toLowerCase() === 'taken') {
                // "Taken" defaults to 'sold' but could be made configurable
                saleType = 'sold'
              }
              
              // Get sales information from stepData if provided (from modal)
              const salesInfo = stepData.sales_info || {}
              const salesEntryResult = await createSalesListingEntry(listingId, userId, latestListing, saleType, salesInfo)
              
              // Check if currency setup is required
              if (salesEntryResult?.error) {
                return NextResponse.json(
                  { 
                    error: salesEntryResult.error,
                    requiresCurrencySetup: salesEntryResult.requiresCurrencySetup || false
                  },
                  { status: 400 }
                )
              }
              
              // Update revenue based on account type
              if (latestListing.account_type === 'developer') {
                const revenueResult = await updateTotalRevenue(userId, latestListing.development_id, estimatedRevenue, 'add')
                if (revenueResult?.error) {
                  return NextResponse.json(
                    { 
                      error: revenueResult.error,
                      requiresCurrencySetup: revenueResult.requiresCurrencySetup || false
                    },
                    { status: 400 }
                  )
                }
              } else if (latestListing.account_type === 'agent') {
                // Import and call agent metrics update function
                const updateModule = await import('@/app/api/listings/[id]/route')
                if (updateModule.updateAgentAndAgencyMetrics) {
                  const metricsResult = await updateModule.updateAgentAndAgencyMetrics(listingId, userId, latestListing, estimatedRevenue, saleType, 'add')
                  if (metricsResult?.error) {
                    return NextResponse.json(
                      { 
                        error: metricsResult.error,
                        requiresCurrencySetup: metricsResult.requiresCurrencySetup || false
                      },
                      { status: 400 }
                    )
                  }
                }
              }
              
              // Update admin_sales_analytics when status changes to sold/rented/taken
              await updateAdminSalesAnalytics(latestListing, 'update')
            }
          }
        } else if (statusChangedFromRentedToSold) {
          // Changing from Rented Out to Sold - only update status, no revenue recalculation
          // Both statuses account for the same revenue, so we just update the sale_type
          const { data: existingSale } = await supabaseAdmin
            .from('sales_listings')
            .select('*')
            .eq('listing_id', listingId)
            .eq('sale_type', 'rented')
            .maybeSingle()
          
          if (existingSale) {
            // Just update the sale_type from 'rented' to 'sold'
            // No revenue recalculation needed since both account for the same thing
            await supabaseAdmin
              .from('sales_listings')
              .update({
                sale_type: 'sold',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSale.id)
            
            // Update admin_sales_analytics (to update sale type counts, but no revenue change)
            await updateAdminSalesAnalytics(latestListing, 'update')
          } else {
            // No existing sale entry, create one (shouldn't happen but handle it)
            const estimatedRevenue = latestListing.estimated_revenue || existingListing.estimated_revenue || {}
            const revenueValue = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
            
            if (revenueValue > 0) {
              await createSalesListingEntry(listingId, userId, latestListing, 'sold')
              // Update revenue based on account type
              if (latestListing.account_type === 'developer') {
                await updateTotalRevenue(userId, latestListing.development_id, estimatedRevenue, 'add')
              } else if (latestListing.account_type === 'agent') {
                const updateModule = await import('@/app/api/listings/[id]/route')
                if (updateModule.updateAgentAndAgencyMetrics) {
                  await updateModule.updateAgentAndAgencyMetrics(listingId, userId, latestListing, estimatedRevenue, 'sold', 'add')
                }
              }
            }
            await updateAdminSalesAnalytics(latestListing, 'update')
          }
        } else if (statusChangedFromSoldOrRentedToAvailable) {
          // Status changed FROM sold/rented/taken TO available or other status
          // Need to subtract revenue and remove/update sales entry
          const estimatedRevenue = existingListing.estimated_revenue || {}
          const revenueValue = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
          
          if (revenueValue > 0) {
            // Find and remove the sales entry
            const { data: existingSale } = await supabaseAdmin
              .from('sales_listings')
              .select('*')
              .eq('listing_id', listingId)
              .maybeSingle()
            
            if (existingSale) {
              // Delete the sales entry
              await supabaseAdmin
                .from('sales_listings')
                .delete()
                .eq('id', existingSale.id)
              
              // Subtract revenue from developer/agent and development
              if (latestListing.account_type === 'developer') {
                await updateTotalRevenue(userId, latestListing.development_id, estimatedRevenue, 'subtract')
              } else if (latestListing.account_type === 'agent') {
                const updateModule = await import('@/app/api/listings/[id]/route')
                if (updateModule.updateAgentAndAgencyMetrics) {
                  await updateModule.updateAgentAndAgencyMetrics(listingId, userId, latestListing, estimatedRevenue, existingSale.sale_type, 'subtract')
                }
              }
              
              // Update admin_sales_analytics
              await updateAdminSalesAnalytics(latestListing, 'update')
            }
          }
        }
      }
      
      // 1.5. Update admin_sales_analytics when pricing changes (estimated_revenue changes)
      if (needsCurrencyConversion && stepName === 'pricing') {
        try {
          await updateAdminSalesAnalytics(latestListing, 'update')
          console.log('✅ admin_sales_analytics updated for pricing change')
        } catch (salesAnalyticsError) {
          console.error('❌ Error updating admin_sales_analytics for pricing:', salesAnalyticsError)
        }
      }

      // 2. Update development stats if categories/development changed
      if (latestListing.account_type === 'developer' && latestListing.development_id) {
        const oldDevelopmentId = existingListing.development_id
        const newDevelopmentId = latestListing.development_id
        const categoriesChanged = 
          stepName === 'categories' || 
          stepName === 'basic-info' && (updateData.development_id !== undefined)

        if (oldDevelopmentId !== newDevelopmentId && oldDevelopmentId) {
          await updateDevelopmentAfterListing(oldDevelopmentId, 'delete')
        }
        
        if (categoriesChanged || oldDevelopmentId !== newDevelopmentId) {
          await updateDevelopmentAfterListing(newDevelopmentId, 'update')
        }
      }

      // 3. Update developer stats (for any step update on developer units)
      if (latestListing.account_type === 'developer' && userId) {
        console.log('🔄 Updating developer metrics after step update...')
        await updateDeveloperAfterListing(userId, 'update')
      }

      // 3.5. Update agent stats (for any step update on agent listings, especially pricing)
      if (latestListing.account_type === 'agent' && userId) {
        console.log('🔄 Updating agent metrics after step update...')
        await updateAgentAfterListing(userId, 'update')
        
        // Also update agency metrics
        const { data: agent } = await supabaseAdmin
          .from('agents')
          .select('agency_id')
          .eq('agent_id', userId)
          .single()
        
        if (agent?.agency_id) {
          await updateAgencyAfterListing(agent.agency_id, 'update')
        }
      }

      // 4. Update admin analytics (only for completed listings)
      const isCompleted = latestListing.listing_condition === 'completed' && latestListing.upload_status === 'completed'
      const isPublished = isCompleted && latestListing.listing_status === 'active'
      
      if (isCompleted) {
        try {
          // Update old admin_analytics table (legacy)
          await updateAdminAnalytics({
            operation: 'update',
            listingData: latestListing,
            oldListingData: existingListing
          })
          console.log('✅ Admin analytics (legacy) updated successfully')
        } catch (analyticsError) {
          console.error('❌ Error updating admin analytics (legacy):', analyticsError)
          // Don't fail the request if analytics fails
        }
      }
      
      // 5. Update new admin_listings_analytics ONLY when listing is finalized/published
      // (listing_status='active' AND listing_condition='completed' AND upload_status='completed')
      if (isPublished) {
        try {
          await updateAdminListingsAnalytics(latestListing)
          console.log('✅ admin_listings_analytics updated successfully (listing published)')
        } catch (listingsAnalyticsError) {
          console.error('❌ Error updating admin_listings_analytics:', listingsAnalyticsError)
          // Don't fail the request if analytics fails
        }
      }
      
      // 6. Update admin_sales_analytics when listing is finalized (to update estimated_revenue for awaiting sales)
      if (isPublished) {
        try {
          await updateAdminSalesAnalytics(latestListing, 'update')
          console.log('✅ admin_sales_analytics updated successfully (listing published)')
        } catch (salesAnalyticsError) {
          console.error('❌ Error updating admin_sales_analytics:', salesAnalyticsError)
          // Don't fail the request if analytics fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedListing,
      message: `${stepName} step ${actuallyNewListing ? 'saved' : 'updated'} successfully`,
      listingId: listingId // Return listing ID for new listings
    })

  } catch (error) {
    console.error('Update step error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
