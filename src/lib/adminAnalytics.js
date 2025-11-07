import { supabaseAdmin } from './supabase'

/**
 * Helper function to update admin_analytics table when listings are created/updated/deleted
 * @param {Object} params - Parameters for the update
 * @param {string} params.operation - 'create', 'update', or 'delete'
 * @param {Object} params.listingData - The listing data (current state for create/update, old state for delete)
 * @param {Object} params.oldListingData - The old listing data (only for 'update' operation)
 */
export async function updateAdminAnalytics({ operation, listingData, oldListingData = null }) {
  console.log('🚀 updateAdminAnalytics FUNCTION STARTED')
  console.log('🚀 Parameters received:', {
    hasOperation: !!operation,
    operation,
    hasListingData: !!listingData,
    listingDataType: typeof listingData,
    listingDataKeys: listingData ? Object.keys(listingData) : 'null'
  })
  
  try {
    if (!listingData) {
      console.error('❌ CRITICAL: listingData is null or undefined!')
      return
    }
    
    console.log('🔵 updateAdminAnalytics called:', { 
      operation, 
      listingId: listingData?.id,
      listing_condition: listingData?.listing_condition,
      upload_status: listingData?.upload_status,
      listing_status: listingData?.listing_status,
      account_type: listingData?.account_type
    })
    
    // Only process completed listings
    // Skip if listing is not completed
    if (listingData.listing_condition !== 'completed' || listingData.upload_status !== 'completed') {
      console.log('⚠️ Skipping analytics update for incomplete listing:', {
        id: listingData.id,
        listing_condition: listingData.listing_condition,
        upload_status: listingData.upload_status,
        full_listing_data: JSON.stringify(listingData, null, 2).substring(0, 500)
      })
      return
    }
    
    console.log('✅ Listing is completed, proceeding with analytics update')
    
    // For update operations, also check old listing
    if (operation === 'update' && oldListingData) {
      // If old listing was incomplete, we should still process it as a delete
      // But if it was completed, we need to handle it properly
      if (oldListingData.listing_condition !== 'completed' || oldListingData.upload_status !== 'completed') {
        // Old listing was incomplete, so this is effectively a new create
        // Continue with update logic
      }
    }
    
    // Get today's date
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    const week = getWeekString(today)
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const quarter = `${today.getFullYear()}-Q${Math.floor(today.getMonth() / 3) + 1}`
    const year = today.getFullYear()

    console.log('📅 Date calculations:', { dateStr, week, month, quarter, year })

    // Fetch or create today's admin_analytics record
    console.log('🔍 Fetching existing admin_analytics record for date:', dateStr)
    let { data: analytics, error: fetchError } = await supabaseAdmin
      .from('admin_analytics')
      .select('*')
      .eq('date', dateStr)
      .single()
    
    console.log('🔍 Fetch result:', {
      found: !!analytics,
      error: fetchError?.code || 'none',
      errorMessage: fetchError?.message || 'none'
    })

    if (fetchError && fetchError.code === 'PGRST116') {
      // Record doesn't exist, create it with defaults
      console.log('📝 No existing record found, creating new analytics record for today')
      analytics = {
        date: dateStr,
        week,
        month,
        quarter,
        year,
        country: [],
        state: [],
        city: [],
        town: [],
        listings_by_property_purpose: {},
        listings_by_property_type: {},
        listings_by_sub_type: {},
        listings_by_category: {},
        developers_metrics: {
          total: 0,
          new: 0,
          active: 0,
          deactivated_accounts: 0,
          inactive: 0,
          verified: 0,
          unverified: 0,
          total_listings: 0,
          total_sales: 0,
          total_revenue: 0,
          total_leads_generated: 0
        },
        agents_metrics: {
          total: 0,
          new: 0,
          active: 0,
          deactivated_accounts: 0,
          inactive: 0,
          verified: 0,
          unverified: 0,
          total_listings: 0,
          total_sales: 0,
          total_revenue: 0,
          total_leads_generated: 0
        },
        agencies_metrics: {
          total: 0,
          new: 0,
          active: 0,
          deactivated_accounts: 0,
          inactive: 0,
          verified: 0,
          unverified: 0,
          total_listings: 0,
          total_sales: 0,
          total_revenue: 0,
          total_leads_generated: 0
        },
        property_seekers_metrics: {
          total: 0,
          new: 0,
          active: 0,
          deactivated_accounts: 0,
          inactive: 0,
          verified: 0,
          unverified: 0,
          total_views: 0,
          total_leads: 0,
          saved_listings: 0
        },
        platform_engagement: {
          total_views: 0,
          unique_views: 0,
          logged_in_views: 0,
          anonymous_views: 0,
          views_by_source: {
            home: 0,
            explore: 0,
            search: 0,
            direct: 0
          }
        },
        platform_impressions: {
          total: 0,
          social_media: 0,
          website_visit: 0,
          share: 0,
          saved_listing: 0
        },
        phone_leads: { total: 0, unique: 0, percentage: 0, by_context: {} },
        message_leads: { total: 0, unique: 0, percentage: 0, by_context: {} },
        email_leads: { total: 0, unique: 0, percentage: 0, by_context: {} },
        appointment_leads: { total: 0, unique: 0, percentage: 0, by_context: {} },
        website_leads: { total: 0, unique: 0, percentage: 0, by_context: {} },
        sales_metrics: {
          total: 0,                    // Total number of listings sold (not rented)
          sales_value: 0,              // Sum of global_price.estimated_revenue (USD) for all sold listings
          avg_sale_price: 0,           // sales_value / total
          total_commission: 0,         // Total commission (for future use)
          avg_commission_rate: 0       // Average commission rate (for future use)
        },
        conversion_rates: {
          conversion_rate: 0,
          lead_to_sale_rate: 0
        }
      }
      console.log('✅ Created new analytics record structure:', {
        date: analytics.date,
        hasDefaults: true,
        developers_metrics_total_listings: analytics.developers_metrics.total_listings
      })
    } else if (fetchError) {
      console.error('❌ Error fetching admin_analytics:', fetchError)
      console.error('❌ Fetch error details:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint
      })
      return
    } else {
      console.log('✅ Found existing analytics record:', {
        date: analytics.date,
        developers_metrics_total_listings: analytics.developers_metrics?.total_listings || 0,
        agents_metrics_total_listings: analytics.agents_metrics?.total_listings || 0
      })
    }

    // Log listing data structure for debugging
    console.log('📋 Listing data keys:', Object.keys(listingData))
    console.log('📋 Listing data sample:', {
      id: listingData.id,
      account_type: listingData.account_type,
      listing_status: listingData.listing_status,
      purposes: listingData.purposes,
      types: listingData.types,
      categories: listingData.categories,
      country: listingData.country,
      state: listingData.state,
      city: listingData.city,
      town: listingData.town,
      price: listingData.price,
      pricing: listingData.pricing,
      global_price: listingData.global_price,
      estimated_revenue: listingData.estimated_revenue
    })

    // Process the operation
    console.log('🔄 Starting to process operation:', operation)
    if (operation === 'create') {
      console.log('🔄 Processing CREATE operation')
      await processCreateOperation(analytics, listingData)
    } else if (operation === 'update') {
      console.log('🔄 Processing UPDATE operation')
      await processUpdateOperation(analytics, listingData, oldListingData)
    } else if (operation === 'delete') {
      console.log('🔄 Processing DELETE operation')
      await processDeleteOperation(analytics, listingData)
    } else {
      console.error('❌ Unknown operation:', operation)
      return
    }
    
    console.log('✅ Processed operation, analytics after processing:', {
      total_listings_developers: analytics.developers_metrics.total_listings,
      total_listings_agents: analytics.agents_metrics.total_listings,
      country_count: analytics.country.length,
      state_count: analytics.state.length,
      city_count: analytics.city.length,
      town_count: analytics.town.length,
      purposes_count: Object.keys(analytics.listings_by_property_purpose).length,
      types_count: Object.keys(analytics.listings_by_property_type).length,
      categories_count: Object.keys(analytics.listings_by_category).length,
      subtypes_count: Object.keys(analytics.listings_by_sub_type).length,
      sales_metrics_total: analytics.sales_metrics.total,
      sales_metrics_sales_value: analytics.sales_metrics.sales_value
    })

    // Recalculate percentages for all location arrays
    console.log('📊 Recalculating location percentages...')
    recalculateLocationPercentages(analytics)
    console.log('✅ Location percentages recalculated')

    // Insert or update the record for today's date
    // This creates a NEW record per day (date is PRIMARY KEY), perfect for time-series graphs
    // - First listing of the day: INSERTs a new record
    // - Subsequent listings on same day: UPDATEs the existing record for that date
    // This allows querying by date to show daily trends and aggregating across dates for weekly/monthly/yearly views
    console.log('💾 Upserting analytics to database...')
    console.log('💾 Analytics data to upsert:', {
      date: analytics.date,
      developers_total_listings: analytics.developers_metrics.total_listings,
      agents_total_listings: analytics.agents_metrics.total_listings,
      sales_total: analytics.sales_metrics.total,
      sales_value: analytics.sales_metrics.sales_value
    })
    
    // Upsert using date as the conflict target (date now has unique constraint)
    console.log('💾 Upserting with onConflict: date...')
    let { error: upsertError, data: upsertData } = await supabaseAdmin
      .from('admin_analytics')
      .upsert(analytics, { onConflict: 'date' })
      .select()

    if (upsertError) {
      console.error('❌ Error upserting admin_analytics:', upsertError)
      console.error('❌ Upsert error details:', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint
      })
      
      // Fallback: Try manual check then insert/update if upsert fails
      console.log('🔄 Falling back to manual insert/update...')
      const { data: existingRecord } = await supabaseAdmin
        .from('admin_analytics')
        .select('id, date')
        .eq('date', analytics.date)
        .maybeSingle()
      
      if (existingRecord) {
        console.log('📝 Record exists, updating...')
        const { data, error } = await supabaseAdmin
          .from('admin_analytics')
          .update(analytics)
          .eq('date', analytics.date)
          .select()
        
        if (error) {
          console.error('❌ Fallback update also failed:', error)
        } else {
          console.log('✅ Fallback update succeeded')
          upsertData = data
          upsertError = null
        }
      } else {
        console.log('➕ Record does not exist, inserting...')
        const { data, error } = await supabaseAdmin
          .from('admin_analytics')
          .insert([analytics])
          .select()
        
        if (error) {
          console.error('❌ Fallback insert also failed:', error)
        } else {
          console.log('✅ Fallback insert succeeded')
          upsertData = data
          upsertError = null
        }
      }
    }
    
    if (!upsertError && upsertData) {
      console.log('✅ Successfully upserted admin_analytics:', { 
        id: upsertData?.[0]?.id,
        date: upsertData?.[0]?.date,
        total_listings_developers: upsertData?.[0]?.developers_metrics?.total_listings,
        total_listings_agents: upsertData?.[0]?.agents_metrics?.total_listings,
        sales_total: upsertData?.[0]?.sales_metrics?.total,
        sales_value: upsertData?.[0]?.sales_metrics?.sales_value
      })
      console.log('🎉 Admin analytics update completed successfully!')
    }
  } catch (error) {
    console.error('❌ Error in updateAdminAnalytics:', error)
    console.error('❌ Error stack:', error.stack)
    // Don't throw - analytics updates shouldn't block listing operations
  }
}

/**
 * Process CREATE operation
 */
async function processCreateOperation(analytics, listingData) {
  console.log('📝 processCreateOperation STARTED')
  console.log('📝 Listing data summary:', {
    id: listingData.id,
    account_type: listingData.account_type,
    listing_status: listingData.listing_status,
    purposes_count: listingData.purposes?.length || 0,
    types_count: listingData.types?.length || 0,
    categories_count: listingData.categories?.length || 0,
    country: listingData.country,
    state: listingData.state,
    city: listingData.city
  })
  
  const increment = 1
  // Fix: Use listing_status instead of status (listing_status is the actual field name in database)
  const listingStatus = listingData.listing_status || listingData.status || ''
  const isSold = listingStatus && listingStatus.toLowerCase() === 'sold'  // Only 'sold', not 'rented'
  const isRented = listingStatus && listingStatus.toLowerCase() === 'rented'
  const isSoldOrRented = isSold || isRented
  
  console.log('💰 Price extraction:', {
    listingStatus,
    isSold,
    isRented,
    isSoldOrRented
  })
  
  // Extract price - check multiple possible locations
  const price = parseFloat(
    listingData.price || 
    listingData.pricing?.price || 
    (listingData.pricing && typeof listingData.pricing === 'object' ? listingData.pricing.price : null) ||
    0
  )
  
  // Extract global_price.estimated_revenue (USD) for sales_amount
  const globalPrice = listingData.global_price || {}
  const salesAmountUSD = isSold ? parseFloat(globalPrice.estimated_revenue || globalPrice.price || 0) : 0
  
  console.log('💰 Price values:', {
    price,
    salesAmountUSD,
    globalPrice: JSON.stringify(globalPrice).substring(0, 200)
  })

  // Ensure arrays exist before processing
  if (!listingData.purposes) listingData.purposes = []
  if (!listingData.types) listingData.types = []
  if (!listingData.categories) listingData.categories = []
  if (!listingData.country) listingData.country = null
  if (!listingData.state) listingData.state = null
  if (!listingData.city) listingData.city = null
  if (!listingData.town) listingData.town = null

  // Update category breakdowns
  // salesIncrement: only count if SOLD (not rented)
  // salesAmountIncrement: USD value from global_price (only if SOLD)
  console.log('📊 Updating category breakdowns...')
  if (listingData.purposes && Array.isArray(listingData.purposes) && listingData.purposes.length > 0) {
    console.log('📊 Updating purposes:', listingData.purposes.length, 'items')
    updateCategoryBreakdown(
      analytics.listings_by_property_purpose, 
      listingData.purposes, 
      increment, 
      isSold ? 1 : 0,           // listings_sold: only if status='sold'
      isSoldOrRented ? price : 0, // sales_value: if sold or rented
      salesAmountUSD              // sales_amount: USD (only if sold)
    )
  } else {
    console.log('⚠️ No purposes to update')
  }
  
  if (listingData.types && Array.isArray(listingData.types) && listingData.types.length > 0) {
    console.log('📊 Updating types:', listingData.types.length, 'items')
    updateCategoryBreakdown(
      analytics.listings_by_property_type, 
      listingData.types, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No types to update')
  }
  
  if (listingData.categories && Array.isArray(listingData.categories) && listingData.categories.length > 0) {
    console.log('📊 Updating categories:', listingData.categories.length, 'items')
    updateCategoryBreakdown(
      analytics.listings_by_category, 
      listingData.categories, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No categories to update')
  }
  
  // Update subtypes
  if (listingData.listing_types?.database && Array.isArray(listingData.listing_types.database) && listingData.listing_types.database.length > 0) {
    console.log('📊 Updating subtypes:', listingData.listing_types.database.length, 'items')
    updateCategoryBreakdown(
      analytics.listings_by_sub_type, 
      listingData.listing_types.database, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No subtypes to update')
  }

  // Update location arrays (only if location data exists)
  console.log('📍 Updating location arrays...')
  if (listingData.country) {
    console.log('📍 Updating country:', listingData.country)
    updateLocationArray(
      analytics.country, 
      listingData.country, 
      null, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No country to update')
  }
  
  if (listingData.state) {
    console.log('📍 Updating state:', listingData.state)
    updateLocationArray(
      analytics.state, 
      listingData.state, 
      { country: listingData.country }, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No state to update')
  }
  
  if (listingData.city) {
    console.log('📍 Updating city:', listingData.city)
    updateLocationArray(
      analytics.city, 
      listingData.city, 
      { state: listingData.state, country: listingData.country }, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No city to update')
  }
  
  if (listingData.town) {
    console.log('📍 Updating town:', listingData.town)
    updateLocationArray(
      analytics.town, 
      listingData.town, 
      { city: listingData.city, state: listingData.state, country: listingData.country }, 
      increment, 
      isSold ? 1 : 0, 
      isSoldOrRented ? price : 0, 
      salesAmountUSD
    )
  } else {
    console.log('⚠️ No town to update')
  }

  // Update user metrics - ALWAYS increment total_listings (cumulative)
  console.log('👤 Updating user metrics for account_type:', listingData.account_type)
  if (listingData.account_type === 'developer') {
    const oldTotal = analytics.developers_metrics.total_listings || 0
    analytics.developers_metrics.total_listings = oldTotal + increment
    console.log('👤 Developer metrics:', {
      total_listings: `${oldTotal} -> ${analytics.developers_metrics.total_listings}`
    })
    if (isSoldOrRented) {
      const oldSales = analytics.developers_metrics.total_sales || 0
      const oldRevenue = analytics.developers_metrics.total_revenue || 0
      analytics.developers_metrics.total_sales = oldSales + increment
      analytics.developers_metrics.total_revenue = oldRevenue + price
      console.log('👤 Developer sales metrics:', {
        total_sales: `${oldSales} -> ${analytics.developers_metrics.total_sales}`,
        total_revenue: `${oldRevenue} -> ${analytics.developers_metrics.total_revenue}`
      })
    }
  } else if (listingData.account_type === 'agent') {
    const oldTotal = analytics.agents_metrics.total_listings || 0
    analytics.agents_metrics.total_listings = oldTotal + increment
    console.log('👤 Agent metrics:', {
      total_listings: `${oldTotal} -> ${analytics.agents_metrics.total_listings}`
    })
    if (isSoldOrRented) {
      const oldSales = analytics.agents_metrics.total_sales || 0
      const oldRevenue = analytics.agents_metrics.total_revenue || 0
      analytics.agents_metrics.total_sales = oldSales + increment
      analytics.agents_metrics.total_revenue = oldRevenue + price
      console.log('👤 Agent sales metrics:', {
        total_sales: `${oldSales} -> ${analytics.agents_metrics.total_sales}`,
        total_revenue: `${oldRevenue} -> ${analytics.agents_metrics.total_revenue}`
      })
    }
  } else {
    console.log('⚠️ Unknown account_type:', listingData.account_type)
  }

  // Update sales_metrics (only for SOLD listings, not rented)
  if (isSold) {
    const oldTotal = analytics.sales_metrics.total || 0
    const oldValue = analytics.sales_metrics.sales_value || 0
    analytics.sales_metrics.total = oldTotal + 1
    analytics.sales_metrics.sales_value = oldValue + salesAmountUSD
    // Recalculate avg_sale_price
    analytics.sales_metrics.avg_sale_price = analytics.sales_metrics.total > 0 
      ? parseFloat((analytics.sales_metrics.sales_value / analytics.sales_metrics.total).toFixed(2))
      : 0
    console.log('💰 Sales metrics updated:', {
      total: `${oldTotal} -> ${analytics.sales_metrics.total}`,
      sales_value: `${oldValue} -> ${analytics.sales_metrics.sales_value}`,
      avg_sale_price: analytics.sales_metrics.avg_sale_price
    })
  } else {
    console.log('ℹ️ Listing is not sold, skipping sales_metrics update')
  }
  
  console.log('✅ processCreateOperation COMPLETED')
}

/**
 * Process UPDATE operation
 */
async function processUpdateOperation(analytics, newListingData, oldListingData) {
  console.log('📝 processUpdateOperation STARTED')
  if (!oldListingData) {
    console.log('⚠️ No oldListingData provided, skipping update')
    return
  }
  
  console.log('📝 New listing data summary:', {
    id: newListingData.id,
    account_type: newListingData.account_type,
    listing_status: newListingData.listing_status,
    purposes_count: newListingData.purposes?.length || 0
  })
  
  console.log('📝 Old listing data summary:', {
    id: oldListingData.id,
    account_type: oldListingData.account_type,
    listing_status: oldListingData.listing_status,
    purposes_count: oldListingData.purposes?.length || 0
  })

  // Check what changed
  const categoriesChanged = 
    JSON.stringify(newListingData.purposes || []) !== JSON.stringify(oldListingData.purposes || []) ||
    JSON.stringify(newListingData.types || []) !== JSON.stringify(oldListingData.types || []) ||
    JSON.stringify(newListingData.categories || []) !== JSON.stringify(oldListingData.categories || []) ||
    JSON.stringify(newListingData.listing_types?.database || []) !== JSON.stringify(oldListingData.listing_types?.database || [])

  const locationChanged = 
    (newListingData.country || '') !== (oldListingData.country || '') ||
    (newListingData.state || '') !== (oldListingData.state || '') ||
    (newListingData.city || '') !== (oldListingData.city || '') ||
    (newListingData.town || '') !== (oldListingData.town || '')

  // Fix: Use listing_status instead of status
  const newListingStatus = newListingData.listing_status || newListingData.status || ''
  const oldListingStatus = oldListingData.listing_status || oldListingData.status || ''
  const statusChanged = newListingStatus !== oldListingStatus
  
  // Separate sold vs rented
  const oldIsSold = oldListingStatus && oldListingStatus.toLowerCase() === 'sold'
  const oldIsRented = oldListingStatus && oldListingStatus.toLowerCase() === 'rented'
  const oldIsSoldOrRented = oldIsSold || oldIsRented
  const newIsSold = newListingStatus && newListingStatus.toLowerCase() === 'sold'
  const newIsRented = newListingStatus && newListingStatus.toLowerCase() === 'rented'
  const newIsSoldOrRented = newIsSold || newIsRented
  
  const oldPrice = parseFloat(oldListingData.price || oldListingData.pricing?.price || 0)
  const newPrice = parseFloat(newListingData.price || newListingData.pricing?.price || 0)
  
  // Extract global_price for USD values
  const oldGlobalPrice = oldListingData.global_price || {}
  const newGlobalPrice = newListingData.global_price || {}
  const oldSalesAmountUSD = oldIsSold ? parseFloat(oldGlobalPrice.estimated_revenue || oldGlobalPrice.price || 0) : 0
  const newSalesAmountUSD = newIsSold ? parseFloat(newGlobalPrice.estimated_revenue || newGlobalPrice.price || 0) : 0

  // Handle category changes
  if (categoriesChanged) {
    // Decrement old categories
    updateCategoryBreakdown(
      analytics.listings_by_property_purpose, 
      oldListingData.purposes, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    updateCategoryBreakdown(
      analytics.listings_by_property_type, 
      oldListingData.types, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    updateCategoryBreakdown(
      analytics.listings_by_category, 
      oldListingData.categories, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    if (oldListingData.listing_types?.database) {
      updateCategoryBreakdown(
        analytics.listings_by_sub_type, 
        oldListingData.listing_types.database, 
        -1, 
        oldIsSold ? -1 : 0, 
        oldIsSoldOrRented ? -oldPrice : 0, 
        -oldSalesAmountUSD
      )
    }

    // Increment new categories
    updateCategoryBreakdown(
      analytics.listings_by_property_purpose, 
      newListingData.purposes, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    updateCategoryBreakdown(
      analytics.listings_by_property_type, 
      newListingData.types, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    updateCategoryBreakdown(
      analytics.listings_by_category, 
      newListingData.categories, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    if (newListingData.listing_types?.database) {
      updateCategoryBreakdown(
        analytics.listings_by_sub_type, 
        newListingData.listing_types.database, 
        1, 
        newIsSold ? 1 : 0, 
        newIsSoldOrRented ? newPrice : 0, 
        newSalesAmountUSD
      )
    }
  } else if (statusChanged || oldPrice !== newPrice) {
    // Only status or price changed, update existing categories
    const priceDiff = newPrice - oldPrice
    const salesDiff = (newIsSold ? 1 : 0) - (oldIsSold ? 1 : 0)
    const salesAmountDiff = newSalesAmountUSD - oldSalesAmountUSD
    
    updateCategoryBreakdown(
      analytics.listings_by_property_purpose, 
      newListingData.purposes, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    updateCategoryBreakdown(
      analytics.listings_by_property_type, 
      newListingData.types, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    updateCategoryBreakdown(
      analytics.listings_by_category, 
      newListingData.categories, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    if (newListingData.listing_types?.database) {
      updateCategoryBreakdown(
        analytics.listings_by_sub_type, 
        newListingData.listing_types.database, 
        0, 
        salesDiff, 
        newIsSoldOrRented ? priceDiff : 0, 
        salesAmountDiff
      )
    }
  }

  // Handle location changes
  if (locationChanged) {
    // Decrement old location
    updateLocationArray(
      analytics.country, 
      oldListingData.country, 
      null, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    updateLocationArray(
      analytics.state, 
      oldListingData.state, 
      { country: oldListingData.country }, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    updateLocationArray(
      analytics.city, 
      oldListingData.city, 
      { state: oldListingData.state, country: oldListingData.country }, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )
    updateLocationArray(
      analytics.town, 
      oldListingData.town, 
      { city: oldListingData.city, state: oldListingData.state, country: oldListingData.country }, 
      -1, 
      oldIsSold ? -1 : 0, 
      oldIsSoldOrRented ? -oldPrice : 0, 
      -oldSalesAmountUSD
    )

    // Increment new location
    updateLocationArray(
      analytics.country, 
      newListingData.country, 
      null, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    updateLocationArray(
      analytics.state, 
      newListingData.state, 
      { country: newListingData.country }, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    updateLocationArray(
      analytics.city, 
      newListingData.city, 
      { state: newListingData.state, country: newListingData.country }, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
    updateLocationArray(
      analytics.town, 
      newListingData.town, 
      { city: newListingData.city, state: newListingData.state, country: newListingData.country }, 
      1, 
      newIsSold ? 1 : 0, 
      newIsSoldOrRented ? newPrice : 0, 
      newSalesAmountUSD
    )
  } else if (statusChanged || oldPrice !== newPrice) {
    // Only status or price changed, update existing location
    const priceDiff = newPrice - oldPrice
    const salesDiff = (newIsSold ? 1 : 0) - (oldIsSold ? 1 : 0)
    const salesAmountDiff = newSalesAmountUSD - oldSalesAmountUSD
    
    updateLocationArray(
      analytics.country, 
      newListingData.country, 
      null, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    updateLocationArray(
      analytics.state, 
      newListingData.state, 
      { country: newListingData.country }, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    updateLocationArray(
      analytics.city, 
      newListingData.city, 
      { state: newListingData.state, country: newListingData.country }, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
    updateLocationArray(
      analytics.town, 
      newListingData.town, 
      { city: newListingData.city, state: newListingData.state, country: newListingData.country }, 
      0, 
      salesDiff, 
      newIsSoldOrRented ? priceDiff : 0, 
      salesAmountDiff
    )
  }

  // Update user metrics if status changed
  if (statusChanged && newListingData.account_type) {
    if (newListingData.account_type === 'developer') {
      if (newIsSoldOrRented && !oldIsSoldOrRented) {
        analytics.developers_metrics.total_sales = (analytics.developers_metrics.total_sales || 0) + 1
        analytics.developers_metrics.total_revenue = (analytics.developers_metrics.total_revenue || 0) + newPrice
      } else if (!newIsSoldOrRented && oldIsSoldOrRented) {
        analytics.developers_metrics.total_sales = Math.max(0, (analytics.developers_metrics.total_sales || 0) - 1)
        analytics.developers_metrics.total_revenue = Math.max(0, (analytics.developers_metrics.total_revenue || 0) - oldPrice)
      } else if (newIsSoldOrRented && oldIsSoldOrRented && oldPrice !== newPrice) {
        // Price changed but still sold/rented
        const priceDiff = newPrice - oldPrice
        analytics.developers_metrics.total_revenue = Math.max(0, (analytics.developers_metrics.total_revenue || 0) + priceDiff)
      }
    } else if (newListingData.account_type === 'agent') {
      if (newIsSoldOrRented && !oldIsSoldOrRented) {
        analytics.agents_metrics.total_sales = (analytics.agents_metrics.total_sales || 0) + 1
        analytics.agents_metrics.total_revenue = (analytics.agents_metrics.total_revenue || 0) + newPrice
      } else if (!newIsSoldOrRented && oldIsSoldOrRented) {
        analytics.agents_metrics.total_sales = Math.max(0, (analytics.agents_metrics.total_sales || 0) - 1)
        analytics.agents_metrics.total_revenue = Math.max(0, (analytics.agents_metrics.total_revenue || 0) - oldPrice)
      } else if (newIsSoldOrRented && oldIsSoldOrRented && oldPrice !== newPrice) {
        // Price changed but still sold/rented
        const priceDiff = newPrice - oldPrice
        analytics.agents_metrics.total_revenue = Math.max(0, (analytics.agents_metrics.total_revenue || 0) + priceDiff)
      }
    }
  }

  // Update sales_metrics (only for SOLD listings, not rented)
  if (statusChanged) {
    if (oldIsSold && !newIsSold) {
      // Was sold, now not sold - decrement
      analytics.sales_metrics.total = Math.max(0, (analytics.sales_metrics.total || 0) - 1)
      analytics.sales_metrics.sales_value = Math.max(0, (analytics.sales_metrics.sales_value || 0) - oldSalesAmountUSD)
    } else if (!oldIsSold && newIsSold) {
      // Was not sold, now sold - increment
      analytics.sales_metrics.total = (analytics.sales_metrics.total || 0) + 1
      analytics.sales_metrics.sales_value = (analytics.sales_metrics.sales_value || 0) + newSalesAmountUSD
    } else if (oldIsSold && newIsSold && oldSalesAmountUSD !== newSalesAmountUSD) {
      // Was sold, still sold, but price changed
      const salesValueDiff = newSalesAmountUSD - oldSalesAmountUSD
      analytics.sales_metrics.sales_value = Math.max(0, (analytics.sales_metrics.sales_value || 0) + salesValueDiff)
    }
    
    // Recalculate avg_sale_price
    if (analytics.sales_metrics.total > 0) {
      analytics.sales_metrics.avg_sale_price = parseFloat((analytics.sales_metrics.sales_value / analytics.sales_metrics.total).toFixed(2))
    } else {
      analytics.sales_metrics.avg_sale_price = 0
    }
    
    console.log('💰 Sales metrics updated after status change:', {
      total: analytics.sales_metrics.total,
      sales_value: analytics.sales_metrics.sales_value,
      avg_sale_price: analytics.sales_metrics.avg_sale_price
    })
  }
  
  console.log('✅ processUpdateOperation COMPLETED')
}

/**
 * Process DELETE operation
 */
async function processDeleteOperation(analytics, listingData) {
  console.log('📝 processDeleteOperation STARTED')
  console.log('📝 Listing data summary:', {
    id: listingData.id,
    account_type: listingData.account_type,
    listing_status: listingData.listing_status,
    purposes_count: listingData.purposes?.length || 0
  })
  
  const decrement = -1
  // Fix: Use listing_status instead of status
  const listingStatus = listingData.listing_status || listingData.status || ''
  const isSold = listingStatus && listingStatus.toLowerCase() === 'sold'
  const isRented = listingStatus && listingStatus.toLowerCase() === 'rented'
  const isSoldOrRented = isSold || isRented
  const price = parseFloat(listingData.price || listingData.pricing?.price || 0)
  
  // Extract global_price for USD values
  const globalPrice = listingData.global_price || {}
  const salesAmountUSD = isSold ? parseFloat(globalPrice.estimated_revenue || globalPrice.price || 0) : 0
  
  console.log('💰 Delete operation price values:', {
    price,
    salesAmountUSD,
    isSold,
    isRented
  })

  // Decrement category breakdowns
  updateCategoryBreakdown(
    analytics.listings_by_property_purpose, 
    listingData.purposes, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  updateCategoryBreakdown(
    analytics.listings_by_property_type, 
    listingData.types, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  updateCategoryBreakdown(
    analytics.listings_by_category, 
    listingData.categories, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  
  if (listingData.listing_types?.database) {
    updateCategoryBreakdown(
      analytics.listings_by_sub_type, 
      listingData.listing_types.database, 
      decrement, 
      isSold ? -1 : 0, 
      isSoldOrRented ? -price : 0, 
      -salesAmountUSD
    )
  }

  // Decrement location arrays
  updateLocationArray(
    analytics.country, 
    listingData.country, 
    null, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  updateLocationArray(
    analytics.state, 
    listingData.state, 
    { country: listingData.country }, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  updateLocationArray(
    analytics.city, 
    listingData.city, 
    { state: listingData.state, country: listingData.country }, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )
  updateLocationArray(
    analytics.town, 
    listingData.town, 
    { city: listingData.city, state: listingData.state, country: listingData.country }, 
    decrement, 
    isSold ? -1 : 0, 
    isSoldOrRented ? -price : 0, 
    -salesAmountUSD
  )

  // Decrement user metrics
  if (listingData.account_type === 'developer') {
    analytics.developers_metrics.total_listings = Math.max(0, (analytics.developers_metrics.total_listings || 0) - 1)
    if (isSoldOrRented) {
      analytics.developers_metrics.total_sales = Math.max(0, (analytics.developers_metrics.total_sales || 0) - 1)
      analytics.developers_metrics.total_revenue = Math.max(0, (analytics.developers_metrics.total_revenue || 0) - price)
    }
  } else if (listingData.account_type === 'agent') {
    analytics.agents_metrics.total_listings = Math.max(0, (analytics.agents_metrics.total_listings || 0) - 1)
    if (isSoldOrRented) {
      analytics.agents_metrics.total_sales = Math.max(0, (analytics.agents_metrics.total_sales || 0) - 1)
      analytics.agents_metrics.total_revenue = Math.max(0, (analytics.agents_metrics.total_revenue || 0) - price)
    }
  }

  // Decrement sales_metrics (only if was SOLD, not rented)
  if (isSold) {
    const oldTotal = analytics.sales_metrics.total || 0
    const oldValue = analytics.sales_metrics.sales_value || 0
    analytics.sales_metrics.total = Math.max(0, oldTotal - 1)
    analytics.sales_metrics.sales_value = Math.max(0, oldValue - salesAmountUSD)
    // Recalculate avg_sale_price
    if (analytics.sales_metrics.total > 0) {
      analytics.sales_metrics.avg_sale_price = parseFloat((analytics.sales_metrics.sales_value / analytics.sales_metrics.total).toFixed(2))
    } else {
      analytics.sales_metrics.avg_sale_price = 0
    }
    
    console.log('💰 Sales metrics decremented:', {
      total: `${oldTotal} -> ${analytics.sales_metrics.total}`,
      sales_value: `${oldValue} -> ${analytics.sales_metrics.sales_value}`,
      avg_sale_price: analytics.sales_metrics.avg_sale_price
    })
  }
  
  console.log('✅ processDeleteOperation COMPLETED')
}

/**
 * Update category breakdown (purposes, types, categories, subtypes)
 * @param {Object} breakdown - The breakdown object to update
 * @param {Array} items - Array of category IDs
 * @param {number} increment - Increment for total_listings
 * @param {number} salesIncrement - Increment for listings_sold (only for status='sold', not 'rented')
 * @param {number} salesValueIncrement - Increment for sales_value (in listing currency)
 * @param {number} salesAmountIncrement - Increment for sales_amount (USD from global_price, only for status='sold')
 */
function updateCategoryBreakdown(breakdown, items, increment, salesIncrement, salesValueIncrement, salesAmountIncrement = 0) {
  if (!items || !Array.isArray(items)) return

  items.forEach(item => {
    const id = typeof item === 'object' ? (item.id || item.category_id) : item
    if (!id) return

    if (!breakdown[id]) {
      breakdown[id] = {
        category_id: id,  // Add category_id field
        total_listings: 0,
        total_sales: 0,
        total_views: 0,
        total_leads: 0,
        sales_value: 0,      // In listing currency
        sales_amount: 0,      // USD from global_price (only for sold listings)
        listings_sold: 0,     // Count of sold listings (not rented)
        percentage: 0
      }
    }

    breakdown[id].total_listings = Math.max(0, (breakdown[id].total_listings || 0) + increment)
    breakdown[id].total_sales = Math.max(0, (breakdown[id].total_sales || 0) + salesIncrement)
    breakdown[id].sales_value = Math.max(0, (breakdown[id].sales_value || 0) + salesValueIncrement)
    breakdown[id].sales_amount = Math.max(0, (breakdown[id].sales_amount || 0) + salesAmountIncrement)
    breakdown[id].listings_sold = Math.max(0, (breakdown[id].listings_sold || 0) + salesIncrement)

    // Recalculate percentage based on total listings
    const totalListings = Object.values(breakdown).reduce((sum, cat) => sum + (cat.total_listings || 0), 0)
    breakdown[id].percentage = totalListings > 0 ? Number(((breakdown[id].total_listings / totalListings) * 100).toFixed(2)) : 0
  })
}

/**
 * Update location array (country, state, city, town)
 * @param {Array} locationArray - The location array to update
 * @param {string} locationName - Name of the location
 * @param {Object} parentContext - Parent location context (country, state, city)
 * @param {number} increment - Increment for total_listings
 * @param {number} salesIncrement - Increment for listings_sold (only for status='sold', not 'rented')
 * @param {number} salesValueIncrement - Increment for sales_value (in listing currency)
 * @param {number} salesAmountIncrement - Increment for sales_amount (USD from global_price, only for status='sold')
 */
function updateLocationArray(locationArray, locationName, parentContext, increment, salesIncrement, salesValueIncrement, salesAmountIncrement = 0) {
  if (!locationName) return

  let location = locationArray.find(loc => {
    if (loc.name !== locationName) return false
    // Check parent context matches
    if (parentContext) {
      if (parentContext.country && loc.country !== parentContext.country) return false
      if (parentContext.state && loc.state !== parentContext.state) return false
      if (parentContext.city && loc.city !== parentContext.city) return false
    }
    return true
  })

  if (!location) {
    location = {
      name: locationName,
      total_listings: 0,
      total_sales: 0,
      total_views: 0,
      total_leads: 0,
      sales_value: 0,      // In listing currency
      sales_amount: 0,     // USD from global_price (only for sold listings)
      listings_sold: 0,    // Count of sold listings (not rented)
      percentage: 0,
      ...parentContext
    }
    locationArray.push(location)
  }

  location.total_listings = Math.max(0, (location.total_listings || 0) + increment)
  location.total_sales = Math.max(0, (location.total_sales || 0) + salesIncrement)
  location.sales_value = Math.max(0, (location.sales_value || 0) + salesValueIncrement)
  location.sales_amount = Math.max(0, (location.sales_amount || 0) + salesAmountIncrement)
  location.listings_sold = Math.max(0, (location.listings_sold || 0) + salesIncrement)
}

/**
 * Recalculate percentages for all location arrays
 */
function recalculateLocationPercentages(analytics) {
  // Recalculate percentages for each location level
  const locationArrays = [
    { arr: analytics.country, name: 'country' },
    { arr: analytics.state, name: 'state' },
    { arr: analytics.city, name: 'city' },
    { arr: analytics.town, name: 'town' }
  ]

  locationArrays.forEach(({ arr }) => {
    const total = arr.reduce((sum, loc) => sum + (loc.total_listings || 0), 0)
    arr.forEach(loc => {
      loc.percentage = total > 0 ? Number(((loc.total_listings / total) * 100).toFixed(2)) : 0
    })
  })
}

/**
 * Get ISO week string (YYYY-Www)
 */
function getWeekString(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

