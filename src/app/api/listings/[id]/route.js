import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { processCurrencyConversions } from '@/lib/currencyConversion'
import { updateAdminAnalytics } from '@/lib/adminAnalytics'
import { updateAdminListingsAnalytics, updateAdminSalesAnalytics } from '@/lib/adminAnalyticsHelpers'

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

// Helper function to calculate development stats from listings
async function calculateDevelopmentStats(developmentId) {
  try {
    // Fetch all listings for this development
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('purposes, types, categories, listing_types, estimated_revenue')
      .eq('development_id', developmentId)

    if (error) {
      console.error('Error fetching listings for stats:', error)
      return null
    }

    if (!listings || listings.length === 0) {
      // Return empty stats if no listings
      return {
        property_purposes_stats: [],
        property_categories_stats: [],
        property_types_stats: [],
        property_subtypes_stats: [],
        total_estimated_revenue: 0
      }
    }

    const totalListings = listings.length

    // Calculate total_estimated_revenue from all listings
    // estimated_revenue is stored as JSONB: { currency, price, estimated_revenue, exchange_rate }
    let totalEstimatedRevenue = 0
    listings.forEach(listing => {
      if (listing.estimated_revenue && typeof listing.estimated_revenue === 'object') {
        // Extract the estimated_revenue value (in user's primary currency)
        const revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
        if (typeof revenueValue === 'number' && revenueValue > 0) {
          totalEstimatedRevenue += revenueValue
        }
      }
    })

    // Count occurrences for each category
    const purposeCounts = {}
    const typeCounts = {}
    const categoryCounts = {}
    const subtypeCounts = {}

    listings.forEach(listing => {
      // Count purposes
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purposeId => {
          const id = typeof purposeId === 'object' ? purposeId.id : purposeId
          purposeCounts[id] = (purposeCounts[id] || 0) + 1
        })
      }

      // Count types
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(typeId => {
          const id = typeof typeId === 'object' ? typeId.id : typeId
          typeCounts[id] = (typeCounts[id] || 0) + 1
        })
      }

      // Count categories
      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach(categoryId => {
          const id = typeof categoryId === 'object' ? categoryId.id : categoryId
          categoryCounts[id] = (categoryCounts[id] || 0) + 1
        })
      }

      // Count subtypes from listing_types.database
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtypeId => {
          const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
          subtypeCounts[id] = (subtypeCounts[id] || 0) + 1
        })
      }
    })

    // Calculate stats arrays with percentage and total_amount
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
    // Get current development
    const { data: development, error: devError } = await supabaseAdmin
      .from('developments')
      .select('total_units')
      .eq('id', developmentId)
      .single()

    if (devError || !development) {
      console.error('Error fetching development:', devError)
      return
    }

    // Calculate new total_units
    let newTotalUnits = development.total_units || 0
    if (operation === 'delete') {
      newTotalUnits = Math.max(0, (newTotalUnits || 0) - 1)
    }
    // For 'update', we don't change total_units, just recalculate stats

    // Calculate stats (includes total_estimated_revenue)
    const stats = await calculateDevelopmentStats(developmentId)

    // Update development
    const updateData = {}

    if (operation === 'delete') {
      updateData.total_units = newTotalUnits
    }

    if (stats) {
      updateData.property_purposes_stats = stats.property_purposes_stats
      updateData.property_categories_stats = stats.property_categories_stats
      updateData.property_types_stats = stats.property_types_stats
      updateData.property_subtypes_stats = stats.property_subtypes_stats
      // Add total_estimated_revenue (calculated from all listings in development)
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
    // Fetch all listings for this developer (across all developments)
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
      // Return empty stats if no listings
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

    // Count occurrences for each category
    const purposeCounts = {}
    const typeCounts = {}
    const categoryCounts = {}
    const subtypeCounts = {}

    // Location-based stats tracking
    const countryStats = {} // { "Ghana": { total_units: 0, unit_sales: 0, sales_amount: 0 } }
    const stateStats = {}
    const cityStats = {}
    const townStats = {}

    listings.forEach(listing => {
      // Count purposes
      if (listing.purposes && Array.isArray(listing.purposes)) {
        listing.purposes.forEach(purposeId => {
          const id = typeof purposeId === 'object' ? purposeId.id : purposeId
          purposeCounts[id] = (purposeCounts[id] || 0) + 1
        })
      }

      // Count types
      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach(typeId => {
          const id = typeof typeId === 'object' ? typeId.id : typeId
          typeCounts[id] = (typeCounts[id] || 0) + 1
        })
      }

      // Count categories
      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach(categoryId => {
          const id = typeof categoryId === 'object' ? categoryId.id : categoryId
          categoryCounts[id] = (categoryCounts[id] || 0) + 1
        })
      }

      // Count subtypes from listing_types.database
      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach(subtypeId => {
          const id = typeof subtypeId === 'object' ? subtypeId.id : subtypeId
          subtypeCounts[id] = (subtypeCounts[id] || 0) + 1
        })
      }

      // Track location stats
      const isSoldOrRented = listing.listing_status === 'sold' || listing.listing_status === 'rented'
      let revenueAmount = 0
      
      if (isSoldOrRented && listing.estimated_revenue && typeof listing.estimated_revenue === 'object') {
        revenueAmount = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
        if (typeof revenueAmount !== 'number' || revenueAmount <= 0) {
          revenueAmount = 0
        }
      }

      // Country stats
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

      // State stats
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

      // City stats
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

      // Town stats
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

    // Calculate stats arrays with percentage and total_amount
    const calculateStats = (counts, total) => {
      return Object.entries(counts).map(([id, count]) => ({
        category_id: id,
        total_amount: count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0
      }))
    }

    // Calculate location stats arrays with total_units, unit_sales, sales_amount, and percentage
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
    
    // Get developer record by developer_id (which matches listings.user_id)
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id, total_units, total_developments, total_revenue, estimated_revenue')
      .eq('developer_id', userId)
      .single()

    if (devError || !developer) {
      console.error('Error fetching developer:', devError)
      return
    }

    // Recalculate total_units from actual listings count
    // Check for completed listings - use listing_status as primary check
    const { count: totalUnitsCount, error: unitsError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('account_type', 'developer')
      .in('listing_status', ['active', 'sold', 'rented'])

    if (unitsError) {
      console.error('Error counting listings:', unitsError)
    }

    // Recalculate total_developments from actual count
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

    // Recalculate estimated_revenue from all completed listings
    const { data: allListings, error: allError } = await supabaseAdmin
      .from('listings')
      .select('estimated_revenue')
      .eq('user_id', userId)
      .eq('account_type', 'developer')
      .in('listing_status', ['active', 'sold', 'rented'])

    let estimatedRevenue = 0
    if (!allError && allListings) {
      allListings.forEach(listing => {
        if (listing.estimated_revenue && typeof listing.estimated_revenue === 'object') {
          const revenueValue = listing.estimated_revenue.estimated_revenue || listing.estimated_revenue.price || 0
          if (typeof revenueValue === 'number' && revenueValue > 0) {
            estimatedRevenue += revenueValue
          }
        }
      })
    }

    // Calculate developer stats (property purposes, categories, types, subtypes)
    const stats = await calculateDeveloperStats(userId)

    // Update developer with recalculated values
    const updateData = {
      total_units: totalUnitsCount || 0,
      total_developments: totalDevelopmentsCount || 0,
      total_revenue: Math.round(totalRevenue),
      total_sales: totalSales,
      estimated_revenue: Math.round(estimatedRevenue)
    }

    // Add stats if calculated
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

    console.log('📊 Updating developer metrics:', {
      developer_id: developer.id,
      total_units: updateData.total_units,
      total_developments: updateData.total_developments,
      total_revenue: updateData.total_revenue,
      estimated_revenue: updateData.estimated_revenue,
      has_stats: !!stats
    })

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

// Helper function to get developer's primary currency
async function getDeveloperPrimaryCurrency(userId) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('developers')
      .select('company_locations, default_currency')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      console.error('Error fetching developer currency:', error)
      return 'USD' // Default
    }

    if (profile.company_locations && Array.isArray(profile.company_locations)) {
      const primaryLocation = profile.company_locations.find(
        loc => loc.primary_location === true
      )
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }

    if (profile.default_currency?.code) {
      return profile.default_currency.code
    }

    return 'USD' // Default
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

    return !!data // Returns true if record exists
  } catch (error) {
    console.error('Error in checkListingAlreadySold:', error)
    return false
  }
}

// Helper function to update total_revenue for developer and development
async function updateTotalRevenue(userId, developmentId, estimatedRevenue, operation = 'add') {
  try {
    const primaryCurrency = await getDeveloperPrimaryCurrency(userId)
    
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
      return
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

    // Update development total_revenue and units_sold
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
  } catch (error) {
    console.error('Error in updateTotalRevenue:', error)
  }
}

// Helper function to create sales_listings entry
async function createSalesListingEntry(listingId, userId, listingData, saleType, salesInfo = {}) {
  try {
    // Get primary currency
    const primaryCurrency = await getDeveloperPrimaryCurrency(userId)
    
    // Extract estimated_revenue value (in primary currency)
    const estimatedRevenue = listingData.estimated_revenue || {}
    const salePrice = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
    
    if (!salePrice || salePrice <= 0) {
      console.error('No sale price available for sales_listings entry')
      return null
    }

    const salesEntry = {
      listing_id: listingId,
      user_id: userId || null, // Optional field
      sale_price: parseFloat(salePrice.toFixed(2)),
      currency: primaryCurrency,
      sale_type: saleType, // 'sold' or 'rented'
      sale_date: new Date().toISOString().split('T')[0], // Today's date
      sale_timestamp: new Date().toISOString(),
      sale_source: salesInfo.sale_source || 'Iska Homes', // From modal or default
      buyer_name: salesInfo.buyer_name || null, // From modal
      notes: salesInfo.notes || null, // From modal
      commission_rate: null, // Can be added later
      commission_amount: null // Can be added later
    }

    const { data, error } = await supabaseAdmin
      .from('sales_listings')
      .insert([salesEntry])
      .select()
      .single()

    if (error) {
      console.error('Error creating sales_listings entry:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createSalesListingEntry:', error)
    return null
  }
}

// Helper function to check if a string is a valid UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Determine if id is a UUID or slug
    const isIdUUID = isUUID(id)
    
    // Fetch the listing - try by ID first if it's a UUID, otherwise by slug
    let query = supabase
      .from('listings')
      .select('*')
    
    if (isIdUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }
    
    const { data: listing, error } = await query.single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // If it's a unit, fetch developer details separately
    let developer = null
    if (listing.listing_type === 'unit' && listing.user_id) {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .select(`
          id,
          name,
          slug,
          profile_image,
          cover_image,
          email,
          phone,
          website,
          description,
          total_developments,
          total_units
        `)
        .eq('developer_id', listing.user_id)
        .single()

      if (!devError) {
        developer = devData
      }
    }

    // If it's a unit, fetch related listings by the same developer
    let relatedListings = []
    if (listing.listing_type === 'unit' && listing.user_id) {
      const { data: related, error: relatedError } = await supabase
      .from('listings')
        .select(`
          id,
          title,
          slug,
          listing_type,
          price,
          currency,
          price_type,
          duration,
          media,
          specifications,
          city,
          state,
          country
        `)
        .eq('user_id', listing.user_id)
        .eq('listing_status', 'active')
        .neq('id', id)
        .limit(6)

      if (!relatedError) {
        relatedListings = related || []
      }
    }

    // Fetch social amenities for this listing
    let socialAmenities = null
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('social_amenities')
      .select('*')
      .eq('listing_id', id)
      .single()

    if (!amenitiesError && amenitiesData) {
      socialAmenities = amenitiesData
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...listing,
        developers: developer,
        relatedListings,
        social_amenities: socialAmenities
      }
    })

  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to upload files
async function uploadFile(file, folder, subfolder) {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('iskaHomes')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('iskaHomes')
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      path: filePath
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get user info
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.user_id

    // Determine if id is a UUID or slug
    const isIdUUID = isUUID(id)
    
    // Check if the listing exists and belongs to the user
    let query = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
    
    if (isIdUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }
    
    const { data: existingListing, error: fetchError } = await query.single()

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found or access denied' },
        { status: 404 }
      )
    }
    
    // Use the actual listing ID (UUID) for all operations
    const listingId = existingListing.id

    // Check content type to handle both JSON and FormData
    const contentType = request.headers.get('content-type') || ''
    let formData
    let jsonData = null
    let isJsonOnlyRequest = false
    
    if (contentType.includes('application/json')) {
      // Handle JSON-only requests (e.g., finalization)
      isJsonOnlyRequest = true
      jsonData = await request.json()
      // Create a minimal FormData-like object for compatibility
      formData = new FormData()
      if (jsonData.listing_status) formData.append('listing_status', jsonData.listing_status)
      if (jsonData.listing_condition) formData.append('listing_condition', jsonData.listing_condition)
      if (jsonData.upload_status) formData.append('upload_status', jsonData.upload_status)
      if (jsonData.final_listing_status) formData.append('final_listing_status', jsonData.final_listing_status)
    } else {
      // Handle FormData requests (normal updates with files)
      formData = await request.formData()
    }
    
    // Handle file uploads (skip for JSON-only requests)
    const uploadedFiles = {
      mediaFiles: [],
      additionalFiles: [],
      model3d: null
    }

    // Skip file uploads for JSON-only requests (finalization)
    let newMediaFiles = []
    let newAdditionalFiles = []
    let newModel3dData = null
    let newVideoData = null
    let albumFilesMap = {}
    
    if (!isJsonOnlyRequest) {
    // Upload new media files
    // Handle old format: mediaFile_0, mediaFile_1, etc.
    for (let i = 0; i < 20; i++) {
      const mediaFile = formData.get(`mediaFile_${i}`)
      if (mediaFile && mediaFile instanceof File) {
        try {
          const uploadedFile = await uploadFile(mediaFile, 'iskaHomes', 'property-media')
          newMediaFiles.push(uploadedFile)
        } catch (error) {
          console.error(`Error uploading media file ${i}:`, error)
          return NextResponse.json(
            { error: `Failed to upload media file: ${error.message}` },
            { status: 500 }
          )
        }
      }
    }
    
    // Handle new album format: album_0_image_0, album_0_image_1, etc.
    // Track which files belong to which albums
      albumFilesMap = {} // { albumIndex: [uploadedFiles] }
    for (let albumIndex = 0; albumIndex < 20; albumIndex++) {
      albumFilesMap[albumIndex] = []
      for (let imageIndex = 0; imageIndex < 50; imageIndex++) {
        const albumImage = formData.get(`album_${albumIndex}_image_${imageIndex}`)
        if (albumImage && albumImage instanceof File) {
          try {
            const uploadedFile = await uploadFile(albumImage, 'iskaHomes', 'property-media')
            albumFilesMap[albumIndex].push(uploadedFile)
            newMediaFiles.push(uploadedFile)
          } catch (error) {
            console.error(`Error uploading album ${albumIndex} image ${imageIndex}:`, error)
            return NextResponse.json(
              { error: `Failed to upload image: ${error.message}` },
              { status: 500 }
            )
          }
        }
      }
    }

    // Upload new additional files
    for (let i = 0; i < 10; i++) { // Check up to 10 additional files
      const additionalFile = formData.get(`additionalFile_${i}`)
      if (additionalFile && additionalFile instanceof File) {
        try {
          const uploadedFile = await uploadFile(additionalFile, 'iskaHomes', 'additional-files')
          newAdditionalFiles.push(uploadedFile)
        } catch (error) {
          console.error(`Error uploading additional file ${i}:`, error)
          return NextResponse.json(
            { error: `Failed to upload additional file: ${error.message}` },
            { status: 500 }
          )
        }
      }
    }

    // Upload new 3D model for developers
    const model3dFile = formData.get('model3d')
    if (model3dFile && model3dFile instanceof File && existingListing.account_type === 'developer') {
      try {
        const uploadedFile = await uploadFile(model3dFile, 'iskaHomes', '3d-models')
        newModel3dData = uploadedFile
      } catch (error) {
        console.error('Error uploading 3D model:', error)
        return NextResponse.json(
          { error: `Failed to upload 3D model: ${error.message}` },
          { status: 500 }
        )
      }
    }
    
    // Upload video file
    const videoFile = formData.get('video')
    if (videoFile && videoFile instanceof File) {
      try {
        const uploadedFile = await uploadFile(videoFile, 'iskaHomes', 'property-videos')
        newVideoData = uploadedFile
      } catch (error) {
        console.error('Error uploading video:', error)
        return NextResponse.json(
          { error: `Failed to upload video: ${error.message}` },
          { status: 500 }
        )
        }
      }
    }
    
    // Extract updated listing data
    // For JSON-only requests (finalization), only update status fields
    let updateData
    if (isJsonOnlyRequest) {
      updateData = {
        listing_status: jsonData.listing_status || existingListing.listing_status,
        listing_condition: jsonData.listing_condition || 'completed',
        upload_status: jsonData.upload_status || 'completed',
        last_modified_by: userId
      }
    } else {
      updateData = {
      title: formData.get('title') || existingListing.title,
      description: formData.get('description') || existingListing.description,
      size: formData.get('size') || existingListing.size,
      status: formData.get('status') || existingListing.status,
      development_id: formData.get('development_id') || existingListing.development_id,
      purposes: formData.get('purposes') ? JSON.parse(formData.get('purposes')) : existingListing.purposes,
      types: formData.get('types') ? JSON.parse(formData.get('types')) : existingListing.types,
      categories: formData.get('categories') ? JSON.parse(formData.get('categories')) : existingListing.categories,
      listing_types: formData.get('listing_types') ? JSON.parse(formData.get('listing_types')) : existingListing.listing_types,
      specifications: formData.get('specifications') ? JSON.parse(formData.get('specifications')) : existingListing.specifications,
      country: formData.get('country') || existingListing.country,
      state: formData.get('state') || existingListing.state,
      city: formData.get('city') || existingListing.city,
      town: formData.get('town') || existingListing.town,
      full_address: formData.get('full_address') || existingListing.full_address,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : existingListing.latitude,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : existingListing.longitude,
      location_additional_information: formData.get('location_additional_information') || existingListing.location_additional_information,
      amenities: (() => {
        const amenities = formData.get('amenities') ? JSON.parse(formData.get('amenities')) : (existingListing.amenities || { inbuilt: [], custom: [], database: [] })
        // Migrate 'general' to 'inbuilt' if present
        if (amenities.general && !amenities.inbuilt) {
          amenities.inbuilt = amenities.general
          delete amenities.general
        }
        return {
          inbuilt: amenities.inbuilt || [],
          custom: amenities.custom || [],
          database: amenities.database || []
        }
      })(),
      // Parse pricing JSONB (new structure) or fallback to flat fields
      pricing: (() => {
        const pricingJson = formData.get('pricing')
        if (pricingJson) {
          try {
            return JSON.parse(pricingJson)
          } catch (e) {
            console.error('Error parsing pricing JSON:', e)
          }
        }
        // Fallback: use existing pricing or construct from flat fields
        return existingListing.pricing || {
          price: existingListing.price || null,
          currency: existingListing.currency || 'GHS',
          duration: existingListing.duration,
          price_type: existingListing.price_type,
          security_requirements: existingListing.security_requirements,
          time: existingListing.pricing?.time || '',
          ideal_duration: existingListing.pricing?.ideal_duration || '',
          time_span: existingListing.pricing?.time_span || 'months'
        }
      })(),
      // Keep separate columns (not in pricing JSONB)
      cancellation_policy: formData.get('cancellation_policy') || existingListing.cancellation_policy,
      is_negotiable: formData.get('is_negotiable') !== null ? formData.get('is_negotiable') === 'true' : existingListing.is_negotiable,
      flexible_terms: formData.get('flexible_terms') !== null ? formData.get('flexible_terms') === 'true' : existingListing.flexible_terms,
      // Legacy flat columns (for backwards compatibility)
      price: formData.get('pricing') ? JSON.parse(formData.get('pricing')).price : (formData.get('price') || existingListing.price),
      currency: formData.get('pricing') ? JSON.parse(formData.get('pricing')).currency : (formData.get('currency') || existingListing.currency),
      duration: formData.get('pricing') ? JSON.parse(formData.get('pricing')).duration : (formData.get('duration') || existingListing.duration),
      price_type: formData.get('pricing') ? JSON.parse(formData.get('pricing')).price_type : (formData.get('price_type') || existingListing.price_type),
      security_requirements: formData.get('pricing') ? JSON.parse(formData.get('pricing')).security_requirements : (formData.get('security_requirements') || existingListing.security_requirements),
      media: (() => {
        const existingMedia = existingListing.media || { banner: null, video: null, youtubeUrl: "", virtualTourUrl: "", mediaFiles: [], albums: [] }
        const formMedia = formData.get('media') ? JSON.parse(formData.get('media')) : {}
        
        // Start with form media data (preserves existing albums structure)
        const updatedMedia = {
          ...existingMedia,
          ...formMedia
        }
        
        // Preserve YouTube URL and virtual tour URL from form data
        if (formMedia.youtubeUrl !== undefined) {
          updatedMedia.youtubeUrl = formMedia.youtubeUrl || ''
        }
        if (formMedia.virtualTourUrl !== undefined) {
          updatedMedia.virtualTourUrl = formMedia.virtualTourUrl || ''
        }
        
        // Merge virtual_tour_link into media.virtualTourUrl if provided separately
        const virtualTourLink = formData.get('virtual_tour_link')
        if (virtualTourLink && !updatedMedia.virtualTourUrl) {
          updatedMedia.virtualTourUrl = virtualTourLink
        }
        
        // Handle albums structure - merge new uploaded images into albums
        // Priority: Use albums from formMedia (frontend state) as it has the latest structure
        // This includes existing images (with URLs) and any structural changes
        let albums = Array.isArray(formMedia.albums) ? formMedia.albums : (existingMedia.albums || [])
        
        // Map new uploaded files to their correct albums based on album index
        // albumFilesMap contains { albumIndex: [uploadedFiles] }
        Object.keys(albumFilesMap).forEach(albumIndexStr => {
          const albumIndex = parseInt(albumIndexStr)
          const filesForAlbum = albumFilesMap[albumIndex]
          
          if (filesForAlbum && filesForAlbum.length > 0) {
            // Get the album at this index (or create it if it doesn't exist)
            let targetAlbum = albums[albumIndex]
            
            if (!targetAlbum) {
              // Album doesn't exist at this index - create General album as fallback
              targetAlbum = albums.find(a => a.name === 'General' || a.isDefault)
              if (!targetAlbum) {
                targetAlbum = {
                  id: `album_general_${id}`,
                  name: 'General',
                  images: [],
                  isDefault: true,
                  created_at: new Date().toISOString()
                }
                albums.push(targetAlbum)
              }
            }
            
            // Add new uploaded images to the target album
            const existingImages = targetAlbum.images || []
            const newImages = filesForAlbum.map((file, index) => ({
              id: `img_${existingImages.length + index + 1}_${id}`,
              url: file.url,
              name: file.originalName,
              path: file.path,
              size: file.size,
              type: file.type,
              filename: file.filename,
              originalName: file.originalName,
              created_at: new Date().toISOString()
            }))
            targetAlbum.images = [...existingImages, ...newImages]
          }
        })
        
        // If we have newMediaFiles but they weren't mapped (old format), add to General album
        const mappedFilesCount = Object.values(albumFilesMap).reduce((sum, files) => sum + files.length, 0)
        if (newMediaFiles.length > mappedFilesCount) {
          // Some files were uploaded in old format - add to General album
          let generalAlbum = albums.find(a => a.name === 'General' || a.isDefault)
          if (!generalAlbum) {
            generalAlbum = {
              id: `album_general_${id}`,
              name: 'General',
              images: [],
              isDefault: true,
              created_at: new Date().toISOString()
            }
            albums.push(generalAlbum)
          }
          
          const existingImages = generalAlbum.images || []
          const unmappedFiles = newMediaFiles.slice(mappedFilesCount)
          const newImages = unmappedFiles.map((file, index) => ({
            id: `img_${existingImages.length + index + 1}_${id}`,
            url: file.url,
            name: file.originalName,
            path: file.path,
            size: file.size,
            type: file.type,
            filename: file.filename,
            originalName: file.originalName,
            created_at: new Date().toISOString()
          }))
          generalAlbum.images = [...existingImages, ...newImages]
        }
        
        // Ensure albums array exists and use the updated structure
        updatedMedia.albums = albums
        
        // Handle video upload
        if (newVideoData) {
          updatedMedia.video = newVideoData
        } else if (formMedia.video && !newVideoData) {
          // Preserve existing video if not being replaced
          updatedMedia.video = formMedia.video
        }
        
        return {
          ...updatedMedia,
          mediaFiles: [...(updatedMedia.mediaFiles || []), ...newMediaFiles]
        }
      })(),
      additional_files: (() => {
        const existingAdditionalFiles = existingListing.additional_files || []
        const formAdditionalFiles = formData.get('additional_files') ? JSON.parse(formData.get('additional_files')) : existingAdditionalFiles
        return [...formAdditionalFiles, ...newAdditionalFiles]
      })(),
      available_from: formData.get('available_from') || existingListing.available_from,
      available_until: formData.get('available_until') || existingListing.available_until,
      acquisition_rules: formData.get('acquisition_rules') || existingListing.acquisition_rules,
      additional_information: formData.get('additional_information') || existingListing.additional_information,
      listing_status: formData.get('listing_status') || existingListing.listing_status,
      is_featured: formData.get('is_featured') !== null ? formData.get('is_featured') === 'true' : existingListing.is_featured,
      is_verified: formData.get('is_verified') !== null ? formData.get('is_verified') === 'true' : existingListing.is_verified,
      is_premium: formData.get('is_premium') !== null ? formData.get('is_premium') === 'true' : existingListing.is_premium,
      last_modified_by: userId,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags')) : existingListing.tags,
      meta_description: formData.get('meta_description') || existingListing.meta_description,
      meta_keywords: formData.get('meta_keywords') || existingListing.meta_keywords,
      seo_title: formData.get('seo_title') || existingListing.seo_title,
      slug: formData.get('slug') || existingListing.slug
      }
    }

    // Handle 3D model for developers
    if (newModel3dData) {
      updateData['3d_model'] = newModel3dData
    } else if (existingListing.account_type === 'developer' && formData.get('model_3d')) {
      updateData['3d_model'] = JSON.parse(formData.get('model_3d'))
    }

    // Process currency conversions if pricing changed
    if (updateData.pricing && updateData.pricing.price) {
      try {
        const conversions = await processCurrencyConversions({
          price: parseFloat(updateData.pricing.price),
          currency: updateData.pricing.currency || 'GHS',
          priceType: updateData.pricing.price_type || 'rent',
          idealDuration: updateData.pricing.ideal_duration ? parseFloat(updateData.pricing.ideal_duration) : null,
          timeSpan: updateData.pricing.time_span || 'months',
          userId: userId,
          accountType: existingListing.account_type || 'developer'
        })
        
        updateData.estimated_revenue = conversions.estimated_revenue
        updateData.global_price = conversions.global_price
      } catch (conversionError) {
        console.error('Error processing currency conversions:', conversionError)
        // Continue without conversions - don't fail the request
      }
    }

    // Set state for update operation
    const finalListingStatus = isJsonOnlyRequest 
      ? (jsonData.listing_status || jsonData.final_listing_status || updateData.listing_status || existingListing.listing_status)
      : (formData.get('final_listing_status') || updateData.listing_status || existingListing.listing_status)
    const oldListingStatus = existingListing.listing_status || 'active'
    
    // Also check the status field for Sold, Rented Out, or Taken
    const oldStatus = existingListing.status || ''
    const newStatus = updateData.status || oldStatus
    const oldStatusIndicatesSoldRentedOrTaken = isStatusSoldRentedOrTaken(oldStatus)
    const newStatusIndicatesSoldRentedOrTaken = isStatusSoldRentedOrTaken(newStatus)
    
    // If status field indicates sold/rented/taken, map it to listing_status
    // If status is NOT sold/rented/taken, reset listing_status to 'active' (if it was previously sold/rented)
    let effectiveListingStatus = finalListingStatus
    if (newStatusIndicatesSoldRentedOrTaken && !finalListingStatus) {
      const mappedStatus = mapStatusToListingStatus(newStatus)
      if (mappedStatus) {
        updateData.listing_status = mappedStatus
        effectiveListingStatus = mappedStatus
      }
    } else if (newStatusIndicatesSoldRentedOrTaken) {
      // If status field indicates sold/rented/taken, use it to determine listing_status
      effectiveListingStatus = mapStatusToListingStatus(newStatus) || finalListingStatus
    } else if (oldStatusIndicatesSoldRentedOrTaken && !newStatusIndicatesSoldRentedOrTaken) {
      // Status changed from sold/rented/taken to something else, reset to active
      if (['sold', 'rented'].includes(oldListingStatus?.toLowerCase())) {
        updateData.listing_status = 'active'
        effectiveListingStatus = 'active'
      }
    }
    
    // Handle status changes to 'sold' or 'rented' or 'taken'
    // Check both listing_status and status field
    const isSoldOrRented = ['sold', 'rented'].includes(effectiveListingStatus?.toLowerCase()) || newStatusIndicatesSoldRentedOrTaken
    const wasSoldOrRented = ['sold', 'rented'].includes(oldListingStatus?.toLowerCase()) || oldStatusIndicatesSoldRentedOrTaken
    const statusChangedToSoldOrRented = isSoldOrRented && !wasSoldOrRented
    const statusChangedFromSoldOrRentedToAvailable = wasSoldOrRented && !isSoldOrRented
    const statusChangedFromRentedToSold = (oldListingStatus?.toLowerCase() === 'rented' || oldStatus?.toLowerCase() === 'rented out') && 
                                         (effectiveListingStatus?.toLowerCase() === 'sold' || newStatus?.toLowerCase() === 'sold')
    
    // Check if listing is already sold when changing to sold/rented (but allow rented->sold transition)
    if (statusChangedToSoldOrRented) {
      const alreadySold = await checkListingAlreadySold(listingId)
      
      if (alreadySold) {
        // Listing already has a sales entry - return error
        // Exception: If currently rented and changing to sold, that's allowed (handled below)
        return NextResponse.json(
          { 
            error: 'This property has already been marked as sold or rented. Please check the sales records.',
            code: 'ALREADY_SOLD'
          },
          { status: 400 }
        )
      }
    }
    
    // Update the listing with state tracking
    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update({
        ...updateData,
        listing_condition: 'updating',
        upload_status: 'incomplete', // Mark as incomplete during update
        listing_status: finalListingStatus
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating listing:', error)
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    // After successful update, mark as completed
    const { data: finalizedListing, error: finalError } = await supabase
      .from('listings')
      .update({
        listing_condition: 'completed',
        upload_status: 'completed',
        listing_status: finalListingStatus
      })
      .eq('id', listingId)
      .select()
      .single()

    if (finalError) {
      console.error('Error finalizing listing update:', finalError)
      // Mark as incomplete but don't fail - listing was updated
      await supabase
        .from('listings')
        .update({
          listing_condition: 'updating',
          upload_status: 'incomplete'
        })
        .eq('id', listingId)
    }

    // Handle social amenities update if provided (skip for JSON-only requests)
    const socialAmenitiesData = !isJsonOnlyRequest ? formData.get('social_amenities') : null
    if (socialAmenitiesData) {
      try {
        const amenities = JSON.parse(socialAmenitiesData)
        
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
          const categoryAmenities = amenities[category] || []
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
        
        // Prepare amenities payload
        const amenitiesPayload = {
          listing_id: listingId,
          schools: processedAmenities.schools || [],
          hospitals: processedAmenities.hospitals || [],
          airports: processedAmenities.airports || [],
          parks: processedAmenities.parks || [],
          shops: processedAmenities.shops || [],
          police: processedAmenities.police || []
        }

        // Check if amenities already exist
        const { data: existingAmenities } = await supabaseAdmin
          .from('social_amenities')
          .select('id')
          .eq('listing_id', listingId)
          .single()

        if (existingAmenities) {
          // Update existing amenities
          const { error: updateAmenitiesError } = await supabaseAdmin
            .from('social_amenities')
            .update(amenitiesPayload)
            .eq('listing_id', listingId)

          if (updateAmenitiesError) {
            console.error('Error updating social amenities:', updateAmenitiesError)
          }
        } else {
          // Insert new amenities
          const { error: insertAmenitiesError } = await supabaseAdmin
            .from('social_amenities')
            .insert([amenitiesPayload])

          if (insertAmenitiesError) {
            console.error('Error inserting social amenities:', insertAmenitiesError)
          }
        }
      } catch (amenitiesParseError) {
        console.error('Error parsing social amenities:', amenitiesParseError)
        // Don't fail the whole request
      }
    }

    // Handle status changes to sold/rented - update total_revenue and sales_listings
    if (updatedListing.account_type === 'developer') {
      const estimatedRevenue = updatedListing.estimated_revenue || existingListing.estimated_revenue || {}
      const revenueValue = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
      
      if (statusChangedToSoldOrRented) {
        // New sale/rent: Add revenue and create sales_listings entry
        // Determine sale type from listing_status or status field
        let saleType = 'sold' // default
        if (effectiveListingStatus?.toLowerCase() === 'rented' || newStatus?.toLowerCase() === 'rented out') {
          saleType = 'rented'
        } else if (effectiveListingStatus?.toLowerCase() === 'sold' || newStatus?.toLowerCase() === 'sold') {
          saleType = 'sold'
        } else if (newStatus?.toLowerCase() === 'taken') {
          // "Taken" defaults to 'sold' but could be made configurable
          saleType = 'sold'
        }
        
        // Get sales information from updateData if provided (from modal)
        const salesInfo = updateData.sales_info || {}
        await createSalesListingEntry(listingId, userId, updatedListing, saleType, salesInfo)
        
        // Add revenue to developer and development total_revenue
        if (revenueValue > 0) {
          await updateTotalRevenue(userId, updatedListing.development_id, estimatedRevenue, 'add')
        }
      } else if (statusChangedFromRentedToSold) {
        // Changed from Rented Out to Sold - only update status, no revenue recalculation
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
        } else {
          // No existing entry, create new one (shouldn't happen but handle it)
          await createSalesListingEntry(listingId, userId, updatedListing, 'sold')
          if (revenueValue > 0) {
            await updateTotalRevenue(userId, updatedListing.development_id, estimatedRevenue, 'add')
          }
        }
        
        // Update admin_sales_analytics (to update sale type counts, but no revenue change)
        await updateAdminSalesAnalytics(updatedListing, 'update')
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
            
            // Subtract revenue from developer and development
            await updateTotalRevenue(userId, updatedListing.development_id, estimatedRevenue, 'subtract')
          }
        }
        
        // Update admin_sales_analytics when status changes from sold/rented to available
        await updateAdminSalesAnalytics(updatedListing, 'update')
      }
    }

    // Update development stats if this is a developer unit and categories/purposes/types changed
    const oldDevelopmentId = existingListing.development_id
    const newDevelopmentId = updateData.development_id || oldDevelopmentId
    const categoriesChanged = updateData.purposes || updateData.types || updateData.categories || updateData.listing_types

    if (updatedListing.account_type === 'developer' && newDevelopmentId) {
      // If development changed, update both old and new developments
      if (oldDevelopmentId !== newDevelopmentId && oldDevelopmentId) {
        await updateDevelopmentAfterListing(oldDevelopmentId, 'delete')
        // Note: We don't increment newDevelopmentId here because the listing was already moved
        // The stats will be recalculated correctly
      }
      
      // Update stats if categories changed or development changed
      if (categoriesChanged || oldDevelopmentId !== newDevelopmentId) {
        await updateDevelopmentAfterListing(newDevelopmentId, 'update')
      }
    }

    // Update developer stats if this is a developer unit (for any updates)
    // Recalculate all metrics from actual listings data
    if (updatedListing.account_type === 'developer' && userId) {
      console.log('🔄 Updating developer metrics after listing update...')
      await updateDeveloperAfterListing(userId, 'update')
    }

    // Update admin analytics (only count completed listings)
    // The updateAdminAnalytics function will check if listing is completed internally
    const listingForAnalytics = finalizedListing || updatedListing
    console.log('📊 About to call updateAdminAnalytics for UPDATE operation...')
    console.log('📊 listingForAnalytics data check:', {
      id: listingForAnalytics?.id,
      listing_condition: listingForAnalytics?.listing_condition,
      upload_status: listingForAnalytics?.upload_status,
      listing_status: listingForAnalytics?.listing_status,
      account_type: listingForAnalytics?.account_type,
      isCompleted: listingForAnalytics?.listing_condition === 'completed' && listingForAnalytics?.upload_status === 'completed'
    })
    
    try {
      // Always call updateAdminAnalytics - it will check completion status internally
      await updateAdminAnalytics({
        operation: 'update',
        listingData: listingForAnalytics,
        oldListingData: existingListing
      })
      console.log('✅ updateAdminAnalytics call completed successfully for listing:', listingForAnalytics.id)
    } catch (analyticsError) {
      console.error('❌ ERROR in updateAdminAnalytics call:', analyticsError)
      console.error('❌ Error stack:', analyticsError?.stack)
      console.error('❌ Error details:', {
        message: analyticsError?.message,
        name: analyticsError?.name
      })
      // Don't fail the listing update if analytics fails
    }
    
    // Update new admin analytics tables when listing is finalized/published
    const isCompleted = listingForAnalytics?.listing_condition === 'completed' && listingForAnalytics?.upload_status === 'completed'
    const isPublished = isCompleted && listingForAnalytics?.listing_status === 'active'
    
    if (isPublished) {
      try {
        // Update admin_listings_analytics when listing is published
        await updateAdminListingsAnalytics(listingForAnalytics)
        console.log('✅ admin_listings_analytics updated successfully (listing published via PUT)')
      } catch (listingsAnalyticsError) {
        console.error('❌ Error updating admin_listings_analytics:', listingsAnalyticsError)
      }
      
      try {
        // Update admin_sales_analytics when listing is published (updates estimated_revenue)
        await updateAdminSalesAnalytics(listingForAnalytics, 'update')
        console.log('✅ admin_sales_analytics updated successfully (listing published via PUT)')
      } catch (salesAnalyticsError) {
        console.error('❌ Error updating admin_sales_analytics:', salesAnalyticsError)
      }
    }
    
    // Update admin_sales_analytics when status changes to sold/rented
    // Reuse statusChangedToSoldOrRented from earlier in the function (line 1237)
    // Note: statusChangedToSoldOrRented was already calculated using oldListingStatus and finalListingStatus
    if (statusChangedToSoldOrRented) {
      try {
        await updateAdminSalesAnalytics(listingForAnalytics, 'update')
        console.log('✅ admin_sales_analytics updated for status change to sold/rented')
      } catch (salesAnalyticsError) {
        console.error('❌ Error updating admin_sales_analytics for status change:', salesAnalyticsError)
      }
    }

    return NextResponse.json({ 
      success: true,
      data: finalizedListing || updatedListing,
      message: 'Listing updated successfully'
    })

  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get user info
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.user_id

    // Determine if id is a UUID or slug
    const isIdUUID = isUUID(id)
    
    // Check if the listing exists and belongs to the user
    let query = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
    
    if (isIdUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }
    
    const { data: existingListing, error: fetchError } = await query.single()

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found or access denied' },
        { status: 404 }
      )
    }

    // Use the actual listing ID (UUID) for deletion operations
    const listingId = existingListing.id

    // Delete social amenities first (cascade will handle this, but explicit is better)
    const { error: amenitiesDeleteError } = await supabaseAdmin
      .from('social_amenities')
      .delete()
      .eq('listing_id', listingId)

    if (amenitiesDeleteError) {
      console.error('Error deleting social amenities:', amenitiesDeleteError)
      // Continue with listing deletion even if amenities deletion fails
    }

    // Store development_id before deletion for stats update
    const developmentId = existingListing.development_id

    // Delete the listing (this will cascade delete related data due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting listing:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    // Update development stats and total_units if this was a developer unit
    if (existingListing.account_type === 'developer' && developmentId) {
      await updateDevelopmentAfterListing(developmentId, 'delete')
    }

    // Update developer total_units if this was a developer unit
    if (existingListing.account_type === 'developer' && userId) {
      await updateDeveloperAfterListing(userId, 'delete')
    }

    // Update admin analytics
    await updateAdminAnalytics({
      operation: 'delete',
      listingData: existingListing
    })

    return NextResponse.json({ 
      success: true,
      message: 'Listing and associated data deleted successfully'
    })

  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}