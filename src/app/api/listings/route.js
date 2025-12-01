import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { processCurrencyConversions } from '@/lib/currencyConversion'
import { updateAdminAnalytics } from '@/lib/adminAnalytics'

// Verify import immediately
console.log('📦 Import check - updateAdminAnalytics type:', typeof updateAdminAnalytics)
console.log('📦 Import check - updateAdminAnalytics is function:', typeof updateAdminAnalytics === 'function')
if (typeof updateAdminAnalytics !== 'function') {
  console.error('❌❌❌ CRITICAL: updateAdminAnalytics is not a function! ❌❌❌')
  console.error('❌ updateAdminAnalytics value:', updateAdminAnalytics)
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
async function updateDevelopmentAfterListing(developmentId, operation = 'create') {
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
    if (operation === 'create') {
      newTotalUnits = (newTotalUnits || 0) + 1
    } else if (operation === 'delete') {
      newTotalUnits = Math.max(0, (newTotalUnits || 0) - 1)
    }

    // Calculate stats (includes total_estimated_revenue)
    const stats = await calculateDevelopmentStats(developmentId)

    // Update development
    const updateData = {
      total_units: newTotalUnits
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

    const { error: updateError } = await supabaseAdmin
      .from('developments')
      .update(updateData)
      .eq('id', developmentId)

    if (updateError) {
      console.error('Error updating development:', updateError)
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
async function updateDeveloperAfterListing(userId, operation = 'create') {
  if (!userId) return

  try {
    console.log('🔄 Recalculating developer metrics for user:', userId)
    
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const listingType = searchParams.get('listing_type') || ''
    const purpose = searchParams.get('purpose') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const priceMin = searchParams.get('price_min') || ''
    const priceMax = searchParams.get('price_max') || ''
    const priceType = searchParams.get('price_type') || ''
    const offset = (page - 1) * limit

    // Build query for listings
    let query = supabase
      .from('listings')
      .select('*')
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }

    if (priceMin) {
      query = query.gte('price', priceMin)
    }

    if (priceMax) {
      query = query.lte('price', priceMax)
    }

    if (priceType) {
      query = query.eq('price_type', priceType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('listing_status', 'active')

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (listingType) {
      countQuery = countQuery.eq('listing_type', listingType)
    }
    if (purpose) {
      countQuery = countQuery.contains('purposes', [purpose])
    }
    if (category) {
      countQuery = countQuery.contains('categories', [category])
    }
    if (location) {
      countQuery = countQuery.or(`city.ilike.%${location}%,state.ilike.%${location}%,country.ilike.%${location}%`)
    }
    if (priceMin) {
      countQuery = countQuery.gte('price', priceMin)
    }
    if (priceMax) {
      countQuery = countQuery.lte('price', priceMax)
    }
    if (priceType) {
      countQuery = countQuery.eq('price_type', priceType)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({ 
      success: true,
      data: listings || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to download image from URL and upload to Supabase
async function downloadAndUploadImage(imageUrl, folder, subfolder, fileName) {
  try {
    // Download image from URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Generate unique filename if not provided
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = fileName?.split('.').pop() || contentType.split('/')[1] || 'jpg'
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${subfolder}/${finalFileName}`
    
    // Upload to Supabase Storage
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
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('iskaHomes')
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Image download/upload error:', error)
    throw error
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

// Helper function to cleanup uploaded files
async function cleanupFiles(files) {
  if (!files || files.length === 0) return
  
  const cleanupPromises = files.map(async (file) => {
    if (!file || !file.path) return
    
    try {
      const { error } = await supabaseAdmin.storage
        .from('iskaHomes')
        .remove([file.path])
      
      if (error) {
        console.error(`Error deleting file ${file.path}:`, error)
      }
    } catch (error) {
      console.error(`Error in cleanup for file ${file.path}:`, error)
    }
  })
  
  await Promise.all(cleanupPromises)
}

// Helper function to extract file paths from listing data
function extractFilePaths(listing) {
  const paths = []
  
  // Extract from media.albums
  if (listing.media?.albums) {
    listing.media.albums.forEach(album => {
      if (album.images) {
        album.images.forEach(image => {
          if (image.path) paths.push(image.path)
        })
      }
    })
  }
  
  // Extract from 3d_model
  if (listing['3d_model']?.path) {
    paths.push(listing['3d_model'].path)
  }
  
  // Extract from floor_plan (if it's an object with path)
  if (listing.floor_plan?.path) {
    paths.push(listing.floor_plan.path)
  }
  
  // Extract from additional_files
  if (listing.additional_files && Array.isArray(listing.additional_files)) {
    listing.additional_files.forEach(file => {
      if (file.path) paths.push(file.path)
    })
  }
  
  return paths
}

export async function POST(request) {
  console.log('🚀🚀🚀 POST /api/listings ROUTE CALLED 🚀🚀🚀')
  console.log('🚀 POST request received at:', new Date().toISOString())
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Authorization header check:', authHeader ? 'Present' : 'Missing')
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
      // Auth failure - return response that will trigger client-side logout
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          auth_failed: true // Flag to trigger logout on client
        },
        { status: 401 }
      )
    }

    const userId = decoded.user_id
    console.log('✅ User authenticated:', { userId, user_id: decoded.user_id })

    // Parse form data
    console.log('📋 Parsing form data...')
    const formData = await request.formData()
    console.log('✅ Form data parsed')

    // Check if user has an incomplete draft to resume
    const resumeListingId = formData.get('resume_listing_id')
    let existingListing = null
    
    if (resumeListingId) {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', resumeListingId)
        .eq('user_id', userId)
        .eq('listing_condition', 'adding')
        .eq('upload_status', 'incomplete')
        .eq('listing_status', 'draft')
        .single()
      
      if (!error && data) {
        existingListing = data
      }
    }

    // Parse the main data JSON from FormData
    const dataJson = formData.get('data')
    let propertyData = {}
    
    if (dataJson) {
      try {
        propertyData = JSON.parse(dataJson)
      } catch (e) {
        console.error('Error parsing data JSON:', e)
        return NextResponse.json(
          { error: 'Invalid data format' },
          { status: 400 }
        )
      }
    }
    
    // Validate required fields before proceeding
    const requiredFields = {
      title: propertyData.title,
      description: propertyData.description,
      status: propertyData.status
    }
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Ensure title and description are not empty after trim
    const trimmedTitle = propertyData.title?.trim() || ''
    const trimmedDescription = propertyData.description?.trim() || ''
    
    if (!trimmedTitle) {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      )
    }
    
    if (!trimmedDescription) {
      return NextResponse.json(
        { error: 'Description is required and cannot be empty' },
        { status: 400 }
      )
    }
    
    // Extract basic listing data from parsed propertyData
    const listingData = {
      account_type: propertyData.account_type || 'developer',
      user_id: userId,
      listing_type: propertyData.listing_type || 'unit',
      title: trimmedTitle,
      description: trimmedDescription,
      size: propertyData.size || null,
      status: propertyData.status || 'Available',
      development_id: propertyData.development_id || null,
      // Set initial state for draft-first approach
      listing_condition: 'adding',
      upload_status: 'incomplete',
      listing_status: 'draft',
      purposes: propertyData.purposes || [],
      types: propertyData.types || [],
      categories: propertyData.categories || [],
      listing_types: propertyData.listing_types || { database: [], inbuilt: [], custom: [] },
      specifications: propertyData.specifications || {},
      country: propertyData.country || null,
      state: propertyData.state || null,
      city: propertyData.city || null,
      town: propertyData.town || null,
      full_address: propertyData.full_address || null,
      latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
      longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null,
      location_additional_information: propertyData.location_additional_information || null,
      // Handle amenities with migration from 'general' to 'inbuilt' and preserve 'database'
      amenities: (() => {
        const amenities = propertyData.amenities || { inbuilt: [], custom: [], database: [] }
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
      // Parse pricing JSONB (new structure)
      pricing: propertyData.pricing || {},
      // Keep separate columns (not in pricing JSONB)
      cancellation_policy: propertyData.cancellation_policy || null,
      is_negotiable: propertyData.is_negotiable === true || propertyData.is_negotiable === 'true',
      flexible_terms: propertyData.flexible_terms === true || propertyData.flexible_terms === 'true',
      // Legacy flat columns (for backwards compatibility)
      price: propertyData.pricing?.price || propertyData.price || null,
      currency: propertyData.pricing?.currency || propertyData.currency || 'GHS',
      duration: propertyData.pricing?.duration || propertyData.duration || null,
      price_type: propertyData.pricing?.price_type || propertyData.price_type || null,
      security_requirements: propertyData.pricing?.security_requirements || propertyData.security_requirements || null,
      media: (() => {
        // Merge virtual_tour_link into media.virtualTourUrl if provided separately
        const media = propertyData.media || { albums: [], virtualTourUrl: '', youtubeUrl: '' }
        // If virtual_tour_link is provided as a separate field, use it
        if (propertyData.virtual_tour_link && !media.virtualTourUrl) {
          media.virtualTourUrl = propertyData.virtual_tour_link
        }
        // Ensure virtualTourUrl is set if provided in media
        if (propertyData.media?.virtualTourUrl) {
          media.virtualTourUrl = propertyData.media.virtualTourUrl
        }
        return media
      })(),
      additional_files: propertyData.additional_files || [],
      available_from: propertyData.available_from || null,
      available_until: propertyData.available_until || null,
      acquisition_rules: propertyData.acquisition_rules || null,
      additional_information: propertyData.additional_information || null,
      listing_status: propertyData.listing_status || 'draft',
      is_featured: propertyData.is_featured === true || propertyData.is_featured === 'true',
      is_verified: propertyData.is_verified === true || propertyData.is_verified === 'true',
      is_premium: propertyData.is_premium === true || propertyData.is_premium === 'true',
      created_by: userId,
      last_modified_by: userId,
      tags: propertyData.tags || [],
      meta_description: propertyData.meta_description || null,
      meta_keywords: propertyData.meta_keywords || null,
      seo_title: propertyData.seo_title || null,
      slug: propertyData.slug || null,
      floor_plan: propertyData.floor_plan || null
    }

    // If resuming, start with existing listing data
    if (existingListing) {
      listingData.id = existingListing.id
      // Merge existing data with new data
      listingData.media = existingListing.media || JSON.parse(formData.get('media') || '{"albums": []}')
      listingData.additional_files = existingListing.additional_files || []
      listingData['3d_model'] = existingListing['3d_model'] || null
      listingData.floor_plan = existingListing.floor_plan || null
    }

    // STEP 1: Create or update listing record first (draft-first approach)
    console.log('🎯 STEP 1: Creating/updating listing record...')
    let newListing
    if (existingListing) {
      console.log('📝 Updating existing draft listing:', existingListing.id)
      // Update existing draft
      const { data, error } = await supabase
        .from('listings')
        .update({
          ...listingData,
          listing_condition: 'adding',
          upload_status: 'incomplete',
          listing_status: 'draft'
        })
        .eq('id', existingListing.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating draft listing:', error)
        return NextResponse.json(
          { error: 'Failed to update draft listing' },
          { status: 500 }
        )
      }
      newListing = data
      console.log('✅ Draft listing updated:', newListing.id)
    } else {
      console.log('📝 Creating new draft listing...')
      // Create new draft listing
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating listing:', error)
        return NextResponse.json(
          { error: 'Failed to create listing' },
          { status: 500 }
        )
      }
      newListing = data
      console.log('✅ New listing created:', newListing.id)
    }

    // Track uploaded files for cleanup if needed
    const uploadedFiles = {
      mediaFiles: [],
      additionalFiles: [],
      model3d: null,
      floorPlan: null,
      video: null
    }

    // STEP 2: Upload media files (now we have listing_id)
    const mediaFiles = []
    // Handle old format: mediaFile_0, mediaFile_1, etc.
    for (let i = 0; i < 20; i++) {
      const mediaFile = formData.get(`mediaFile_${i}`)
      if (mediaFile && mediaFile instanceof File) {
        try {
          const uploadedFile = await uploadFile(mediaFile, 'iskaHomes', 'property-media')
          mediaFiles.push(uploadedFile)
          uploadedFiles.mediaFiles.push(uploadedFile)
        } catch (error) {
          console.error(`Error uploading media file ${i}:`, error)
          // Cleanup uploaded files and listing
          await cleanupFiles([...uploadedFiles.mediaFiles])
          await cleanupFiles([...uploadedFiles.additionalFiles])
          if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
          if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
          if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
          
          // Delete the draft listing
          await supabase.from('listings').delete().eq('id', newListing.id)
          
          return NextResponse.json(
            { error: `Failed to upload media file: ${error.message}` },
            { status: 500 }
          )
        }
      }
    }
    
    // Handle new album format: album_0_image_0, album_0_image_1, etc.
    for (let albumIndex = 0; albumIndex < 20; albumIndex++) {
      for (let imageIndex = 0; imageIndex < 50; imageIndex++) {
        const albumImage = formData.get(`album_${albumIndex}_image_${imageIndex}`)
        if (albumImage && albumImage instanceof File) {
          try {
            const uploadedFile = await uploadFile(albumImage, 'iskaHomes', 'property-media')
            mediaFiles.push(uploadedFile)
            uploadedFiles.mediaFiles.push(uploadedFile)
          } catch (error) {
            console.error(`Error uploading album ${albumIndex} image ${imageIndex}:`, error)
            // Cleanup uploaded files and listing
            await cleanupFiles([...uploadedFiles.mediaFiles])
            await cleanupFiles([...uploadedFiles.additionalFiles])
            if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
            if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
            if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
            
            // Delete the draft listing
            await supabase.from('listings').delete().eq('id', newListing.id)
            
            return NextResponse.json(
              { error: `Failed to upload image: ${error.message}` },
              { status: 500 }
            )
          }
        }
      }
    }

    // Upload additional files
    const additionalFiles = []
    for (let i = 0; i < 10; i++) { // Check up to 10 additional files
      const additionalFile = formData.get(`additionalFile_${i}`)
      if (additionalFile && additionalFile instanceof File) {
        try {
          const uploadedFile = await uploadFile(additionalFile, 'iskaHomes', 'additional-files')
          additionalFiles.push(uploadedFile)
          uploadedFiles.additionalFiles.push(uploadedFile)
        } catch (error) {
          console.error(`Error uploading additional file ${i}:`, error)
          // Cleanup uploaded files and listing
          await cleanupFiles([...uploadedFiles.mediaFiles])
          await cleanupFiles([...uploadedFiles.additionalFiles])
          if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
          if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
          if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
          
          // Delete the draft listing
          await supabase.from('listings').delete().eq('id', newListing.id)
          
          return NextResponse.json(
            { error: `Failed to upload additional file: ${error.message}` },
            { status: 500 }
          )
        }
      }
    }

    // Upload 3D model for developers
    let model3dData = null
    const model3dFile = formData.get('model3d')
    if (model3dFile && model3dFile instanceof File && listingData.account_type === 'developer') {
      try {
        const uploadedFile = await uploadFile(model3dFile, 'iskaHomes', '3d-models')
        model3dData = uploadedFile
        uploadedFiles.model3d = uploadedFile
      } catch (error) {
        console.error('Error uploading 3D model:', error)
        // Cleanup uploaded files and listing
        await cleanupFiles([...uploadedFiles.mediaFiles])
        await cleanupFiles([...uploadedFiles.additionalFiles])
        if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
        if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
        
        // Delete the draft listing
        await supabase.from('listings').delete().eq('id', newListing.id)
        
        return NextResponse.json(
          { error: `Failed to upload 3D model: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Upload video file
    let videoData = null
    const videoFile = formData.get('video')
    if (videoFile && videoFile instanceof File) {
      try {
        const uploadedFile = await uploadFile(videoFile, 'iskaHomes', 'property-videos')
        videoData = uploadedFile
        uploadedFiles.video = uploadedFile
      } catch (error) {
        console.error('Error uploading video:', error)
        // Cleanup uploaded files and listing
        await cleanupFiles([...uploadedFiles.mediaFiles])
        await cleanupFiles([...uploadedFiles.additionalFiles])
        if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
        if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
        
        // Delete the draft listing
        await supabase.from('listings').delete().eq('id', newListing.id)
        
        return NextResponse.json(
          { error: `Failed to upload video: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Upload floor plan
    let floorPlanData = null
    const floorPlanFile = formData.get('floorPlan')
    if (floorPlanFile && floorPlanFile instanceof File) {
      try {
        const uploadedFile = await uploadFile(floorPlanFile, 'iskaHomes', 'floor-plans')
        floorPlanData = uploadedFile
        uploadedFiles.floorPlan = uploadedFile
      } catch (error) {
        console.error('Error uploading floor plan:', error)
        // Cleanup uploaded files and listing
        await cleanupFiles([...uploadedFiles.mediaFiles])
        await cleanupFiles([...uploadedFiles.additionalFiles])
        if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
        if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
        
        // Delete the draft listing
        await supabase.from('listings').delete().eq('id', newListing.id)
        
        return NextResponse.json(
          { error: `Failed to upload floor plan: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // STEP 3: Update media data with uploaded files
    const existingMedia = existingListing?.media || JSON.parse(formData.get('media') || '{"albums": [], "youtubeUrl": "", "virtualTourUrl": ""}')
    
    // Preserve YouTube URL and virtual tour URL from form data
    const formMediaData = JSON.parse(formData.get('media') || '{}')
    if (formMediaData.youtubeUrl !== undefined) {
      existingMedia.youtubeUrl = formMediaData.youtubeUrl || ''
    }
    if (formMediaData.virtualTourUrl !== undefined) {
      existingMedia.virtualTourUrl = formMediaData.virtualTourUrl || ''
    }
    
    // Handle video upload
    if (videoData) {
      existingMedia.video = videoData
    } else if (formMediaData.video && !videoData) {
      // Preserve existing video if not being replaced
      existingMedia.video = formMediaData.video
    }
    
    // Handle albums structure
    if (existingMedia.albums && Array.isArray(existingMedia.albums)) {
      // Merge new images into existing albums
      // If we have uploaded files, add them to the General album
      if (mediaFiles.length > 0) {
        const generalAlbum = existingMedia.albums.find(a => a.name === 'General' || a.isDefault)
        if (generalAlbum) {
          const newImages = mediaFiles.map((file, index) => ({
            id: `img_${(generalAlbum.images?.length || 0) + index + 1}_${newListing.id}`,
            url: file.url,
            name: file.originalName,
            path: file.path,
            size: file.size,
            type: file.type,
            filename: file.filename,
            originalName: file.originalName,
            created_at: new Date().toISOString()
          }))
          generalAlbum.images = [...(generalAlbum.images || []), ...newImages]
        } else {
          // Create General album if it doesn't exist
          existingMedia.albums.push({
            id: `album_general_${newListing.id}`,
            name: 'General',
            images: mediaFiles.map((file, index) => ({
              id: `img_${index + 1}_${newListing.id}`,
              url: file.url,
              name: file.originalName,
              path: file.path,
              size: file.size,
              type: file.type,
              filename: file.filename,
              originalName: file.originalName,
              created_at: new Date().toISOString()
            })),
            isDefault: true,
            created_at: new Date().toISOString()
          })
        }
      }
    } else {
      // Legacy structure - convert to albums
      existingMedia.albums = [{
        id: `album_general_${newListing.id}`,
        name: 'General',
        images: mediaFiles.map((file, index) => ({
          id: `img_${index + 1}_${newListing.id}`,
          url: file.url,
          name: file.originalName,
          path: file.path,
          size: file.size,
          type: file.type,
          filename: file.filename,
          originalName: file.originalName,
          created_at: new Date().toISOString()
        })),
        isDefault: true,
        created_at: new Date().toISOString()
      }]
    }
    
    listingData.media = existingMedia

    // Update additional files
    const existingAdditionalFiles = existingListing?.additional_files || JSON.parse(formData.get('additional_files') || '[]')
    listingData.additional_files = [...existingAdditionalFiles, ...additionalFiles]

    // Handle 3D model for developers
    if (model3dData) {
      listingData['3d_model'] = model3dData
    } else if (existingListing?.['3d_model']) {
      listingData['3d_model'] = existingListing['3d_model']
    } else if (formData.get('model_3d')) {
      listingData['3d_model'] = JSON.parse(formData.get('model_3d'))
    }

    // Handle floor plan
    if (floorPlanData) {
      listingData.floor_plan = floorPlanData
    } else if (existingListing?.floor_plan) {
      listingData.floor_plan = existingListing.floor_plan
    }

    // Validate required fields
    if (!listingData.title || !listingData.description) {
      // Cleanup uploaded files and listing
      await cleanupFiles([...uploadedFiles.mediaFiles])
      await cleanupFiles([...uploadedFiles.additionalFiles])
      if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
      if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
      if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
      await supabase.from('listings').delete().eq('id', newListing.id)
      
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Process currency conversions (if pricing data exists)
    let estimatedRevenue = {}
    let globalPrice = {}
    
    if (listingData.pricing && listingData.pricing.price) {
      try {
        const conversions = await processCurrencyConversions({
          price: parseFloat(listingData.pricing.price),
          currency: listingData.pricing.currency || 'GHS',
          priceType: listingData.pricing.price_type || 'rent',
          idealDuration: listingData.pricing.ideal_duration ? parseFloat(listingData.pricing.ideal_duration) : null,
          timeSpan: listingData.pricing.time_span || 'months',
          userId: userId,
          accountType: listingData.account_type || 'developer'
        })
        
        estimatedRevenue = conversions.estimated_revenue
        globalPrice = conversions.global_price
      } catch (conversionError) {
        console.error('Error processing currency conversions:', conversionError)
        // Continue without conversions - don't fail the request
      }
    }

    // Add currency conversion results to listing data
    listingData.estimated_revenue = estimatedRevenue
    listingData.global_price = globalPrice

    // STEP 4: Update listing with all data (files, amenities, etc.)
    console.log('🎯 STEP 4: Updating listing with all data (files, amenities, etc.)...')
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        ...listingData,
        upload_status: 'completed' // Files uploaded successfully
      })
      .eq('id', newListing.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating listing with files:', updateError)
      // Cleanup uploaded files and listing
      await cleanupFiles([...uploadedFiles.mediaFiles])
      await cleanupFiles([...uploadedFiles.additionalFiles])
      if (uploadedFiles.model3d) await cleanupFiles([uploadedFiles.model3d])
      if (uploadedFiles.floorPlan) await cleanupFiles([uploadedFiles.floorPlan])
      if (uploadedFiles.video) await cleanupFiles([uploadedFiles.video])
      await supabase.from('listings').delete().eq('id', newListing.id)
      
      return NextResponse.json(
        { error: 'Failed to update listing with files' },
        { status: 500 }
      )
    }
    
    console.log('✅ Listing updated with all data:', updatedListing.id)
    newListing = updatedListing


    // STEP 5: Handle social amenities if provided
    const socialAmenitiesData = formData.get('social_amenities')
    if (socialAmenitiesData && newListing) {
      try {
        const amenities = JSON.parse(socialAmenitiesData)
        
        // Process each amenity category and download/store images
        const processedAmenities = {}
        const amenityCategories = ['schools', 'hospitals', 'airports', 'parks', 'shops', 'police']
        
        for (const category of amenityCategories) {
          const categoryAmenities = amenities[category] || []
          processedAmenities[category] = await Promise.all(
            categoryAmenities.map(async (amenity) => {
              const processedAmenity = { ...amenity }
              
              // Download and store image if photoUrl exists
              if (amenity.photoUrl || amenity.photos?.[0]?.url) {
                try {
                  const imageUrl = amenity.photoUrl || amenity.photos?.[0]?.url
                  // Generate filename from amenity id and name
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
                  // Continue without database_url if image download fails
                  processedAmenity.database_url = null
                }
              }
              
              return processedAmenity
            })
          )
        }
        
        // Insert or update social amenities for the listing
        const amenitiesPayload = {
          listing_id: newListing.id,
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
          .eq('listing_id', newListing.id)
          .single()

        if (existingAmenities) {
          // Update existing
          const { error: amenitiesError } = await supabaseAdmin
            .from('social_amenities')
            .update(amenitiesPayload)
            .eq('listing_id', newListing.id)

          if (amenitiesError) {
            console.error('Error updating social amenities:', amenitiesError)
            // Don't fail - continue
          }
        } else {
          // Insert new
          const { error: amenitiesError } = await supabaseAdmin
            .from('social_amenities')
            .insert([amenitiesPayload])

          if (amenitiesError) {
            console.error('Error saving social amenities:', amenitiesError)
            // Don't fail - continue
          }
        }
      } catch (amenitiesParseError) {
        console.error('Error parsing social amenities:', amenitiesParseError)
        // Don't fail the whole request
      }
    }

    // STEP 6: Update development stats and total_units if this is a developer unit
    if (listingData.account_type === 'developer' && listingData.development_id) {
      await updateDevelopmentAfterListing(listingData.development_id, 'create')
    }

    // STEP 6.5: Update developer total_units if this is a developer unit
    if (listingData.account_type === 'developer' && userId) {
      await updateDeveloperAfterListing(userId, 'create')
    }

    // STEP 7: Final step - Mark as completed and set listing_status
    console.log('🎯 STEP 7: Finalizing listing...')
    const finalListingStatus = formData.get('final_listing_status') || (resumeListingId ? 'draft' : 'active')
    
    console.log('📝 Finalizing listing:', { 
      id: newListing.id, 
      finalListingStatus,
      resumeListingId: resumeListingId || 'none'
    })
    
    console.log('💾 Updating listing to completed status...')
    const { data: finalListing, error: finalError } = await supabase
      .from('listings')
      .update({
        listing_condition: 'completed',
        upload_status: 'completed',
        listing_status: finalListingStatus
      })
      .eq('id', newListing.id)
      .select('*')  // Select all fields to ensure we have everything
      .single()

    if (finalError) {
      console.error('❌ Error finalizing listing:', finalError)
      console.error('❌ Final error details:', {
        code: finalError.code,
        message: finalError.message,
        details: finalError.details
      })
      // Don't cleanup here - listing exists with files, just mark as incomplete
      await supabase
        .from('listings')
        .update({
          listing_condition: 'adding',
          upload_status: 'incomplete'
        })
        .eq('id', newListing.id)
      
      return NextResponse.json(
        { error: 'Failed to finalize listing' },
        { status: 500 }
      )
    }

    console.log('✅ Listing finalized successfully!')
    console.log('✅ Listing finalized:', {
      id: finalListing.id,
      listing_condition: finalListing.listing_condition,
      upload_status: finalListing.upload_status,
      listing_status: finalListing.listing_status,
      account_type: finalListing.account_type,
      hasPurposes: !!finalListing.purposes,
      hasTypes: !!finalListing.types,
      hasCategories: !!finalListing.categories
    })

    // STEP 8: Update admin analytics (only count completed listings)
    // The updateAdminAnalytics function will check if listing is completed internally
    console.log('🎯🎯🎯 STEP 8: ABOUT TO CALL updateAdminAnalytics 🎯🎯🎯')
    console.log('📊 About to call updateAdminAnalytics for CREATE operation...')
    console.log('📊 finalListing data check:', {
      id: finalListing?.id,
      listing_condition: finalListing?.listing_condition,
      upload_status: finalListing?.upload_status,
      listing_status: finalListing?.listing_status,
      account_type: finalListing?.account_type,
      isCompleted: finalListing?.listing_condition === 'completed' && finalListing?.upload_status === 'completed'
    })
    console.log('📊 Full finalListing object keys:', Object.keys(finalListing || {}))
    
    try {
      console.log('🔄 CALLING updateAdminAnalytics NOW...')
      console.log('🔄 updateAdminAnalytics type check:', typeof updateAdminAnalytics)
      if (typeof updateAdminAnalytics !== 'function') {
        console.error('❌❌❌ updateAdminAnalytics IS NOT A FUNCTION! ❌❌❌')
        throw new Error('updateAdminAnalytics is not a function')
      }
      console.log('🔄 Parameters:', {
        operation: 'create',
        listingId: finalListing?.id,
        hasListingData: !!finalListing
      })
      
      // Always call updateAdminAnalytics - it will check completion status internally
      console.log('🔄 About to await updateAdminAnalytics...')
      const analyticsResult = await updateAdminAnalytics({
        operation: 'create',
        listingData: finalListing
      })
      console.log('🔄 updateAdminAnalytics await completed')
      
      console.log('✅✅✅ updateAdminAnalytics call completed successfully! ✅✅✅')
      console.log('✅ Analytics result:', analyticsResult)
      console.log('✅ For listing:', finalListing.id)
    } catch (analyticsError) {
      console.error('❌❌❌ ERROR in updateAdminAnalytics call! ❌❌❌')
      console.error('❌ ERROR in updateAdminAnalytics call:', analyticsError)
      console.error('❌ Error stack:', analyticsError?.stack)
      console.error('❌ Error details:', {
        message: analyticsError?.message,
        name: analyticsError?.name,
        code: analyticsError?.code
      })
      // Don't fail the listing creation if analytics fails
    }

    console.log('🎉 Returning success response...')
    return NextResponse.json({ 
      success: true,
      data: finalListing,
      message: 'Listing created successfully'
    })

  } catch (error) {
    console.error('❌❌❌ CREATE LISTING ERROR (TOP LEVEL) ❌❌❌')
    console.error('Create listing error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}