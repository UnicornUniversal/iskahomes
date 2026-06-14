import { supabaseAdmin } from '@/lib/supabase'

export function resolveImageUrl(imageField) {
  if (!imageField) return null
  if (typeof imageField === 'string') {
    if (imageField.startsWith('http')) return imageField
    try {
      const parsed = JSON.parse(imageField)
      return parsed?.url || null
    } catch {
      return null
    }
  }
  return imageField?.url || null
}

export function getListingImageFromMedia(media) {
  if (!media) return null
  try {
    const mediaObj = typeof media === 'string' ? JSON.parse(media) : media
    if (mediaObj.albums?.[0]?.images?.[0]?.url) return mediaObj.albums[0].images[0].url
    if (mediaObj.banner?.url) return mediaObj.banner.url
    if (mediaObj.mediaFiles?.[0]?.url) return mediaObj.mediaFiles[0].url
    return null
  } catch {
    return null
  }
}

export function listingHasCategoryId(listing, field, categoryId) {
  if (!categoryId) return true
  const values = Array.isArray(listing?.[field]) ? listing[field] : []
  if (!values.length) return false
  return values.some((item) => {
    const id = typeof item === 'object' ? item.id : item
    return String(id) === String(categoryId)
  })
}

export function parseCommissionPercentage(commissionRate) {
  if (commissionRate == null) return 0
  if (typeof commissionRate === 'number') return commissionRate
  if (typeof commissionRate === 'object') {
    return Number(commissionRate.percentage) || Number(commissionRate.rate) || 0
  }
  return 0
}

export function calculateSaleCommission(sale) {
  const salePrice = Number(sale?.sale_price) || 0
  const recordedAmount = Number(sale?.commission_amount)

  if (Number.isFinite(recordedAmount) && recordedAmount > 0) {
    return { paid: recordedAmount, pending: 0 }
  }

  const percentage = parseCommissionPercentage(sale?.commission_rate)
  if (percentage > 0 && salePrice > 0) {
    const pending = (salePrice * percentage) / 100
    return { paid: 0, pending }
  }

  return { paid: 0, pending: 0 }
}

export function getCommissionAmount(sale) {
  const { paid, pending } = calculateSaleCommission(sale)
  return paid > 0 ? paid : pending
}

export function calculateListingExpectedCommission(listing) {
  const revenue =
    Number(listing?.estimated_revenue?.estimated_revenue) ||
    Number(listing?.estimated_revenue?.price) ||
    Number(listing?.global_price) ||
    0
  const percentage = parseCommissionPercentage(listing?.commission_rate)
  if (revenue <= 0 || percentage <= 0) return 0
  return (revenue * percentage) / 100
}

export async function resolveDeveloperId({ userId, slug }) {
  if (userId) return userId
  if (!slug) return null

  const { data: developer } = await supabaseAdmin
    .from('developers')
    .select('developer_id')
    .eq('slug', slug)
    .single()

  return developer?.developer_id || null
}

export async function fetchSalesRowsForAccount({
  accountType = 'developer',
  accountId,
  slug,
  dateFrom,
  dateTo
}) {
  const selectFields =
    'sale_type, sale_price, sale_source, listing_id, commission_rate, commission_amount, sale_date'

  let salesQuery = null

  if (accountType === 'agency' && accountId) {
    const { data: agencyListings } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('listing_agency_id', accountId)

    const listingIds = (agencyListings || []).map((listing) => listing.id)
    if (!listingIds.length) return []

    salesQuery = supabaseAdmin
      .from('sales_listings')
      .select(selectFields)
      .in('listing_id', listingIds)
  } else {
    let finalUserId = accountId
    if (accountType === 'developer') {
      finalUserId = await resolveDeveloperId({ userId: accountId, slug })
    }

    if (!finalUserId) return []

    salesQuery = supabaseAdmin
      .from('sales_listings')
      .select(selectFields)
      .eq('user_id', finalUserId)
  }

  if (dateFrom) salesQuery = salesQuery.gte('sale_date', dateFrom)
  if (dateTo) salesQuery = salesQuery.lte('sale_date', dateTo)

  const { data: salesData, error } = await salesQuery
  if (error) throw error
  return salesData || []
}

export async function fetchActiveListingsForCommission({ accountType, accountId }) {
  if (!accountId) return []

  let query = supabaseAdmin
    .from('listings')
    .select('estimated_revenue, commission_rate, global_price, listing_status')
    .in('listing_status', ['active', 'draft'])
    .eq('upload_status', 'completed')

  if (accountType === 'agency') {
    query = query.eq('listing_agency_id', accountId)
  } else if (accountType === 'agent') {
    query = query.eq('user_id', accountId).eq('account_type', 'agent')
  } else {
    query = query.eq('user_id', accountId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export function buildCommissionSummary(salesRows, activeListings = []) {
  let totalCommissionPaid = 0
  let totalCommissionPendingOnSales = 0

  salesRows.forEach((sale) => {
    const { paid, pending } = calculateSaleCommission(sale)
    totalCommissionPaid += paid
    totalCommissionPendingOnSales += pending
  })

  const totalCommissionExpectedOnActive = activeListings.reduce(
    (sum, listing) => sum + calculateListingExpectedCommission(listing),
    0
  )

  return {
    totalCommissionPaid,
    totalCommissionPendingOnSales,
    totalCommissionExpectedOnActive,
    totalCommissionToBePaid: totalCommissionPendingOnSales + totalCommissionExpectedOnActive
  }
}

export async function buildTaxonomySummary(salesData) {
  const totalRevenue = salesData.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0)

  const by_purpose = {}
  salesData.forEach((sale) => {
    const saleType = sale.sale_type || 'sold'
    const typeName = saleType === 'sold' ? 'Sale' : saleType === 'rented' ? 'Rent' : 'Lease'
    if (!by_purpose[typeName]) {
      by_purpose[typeName] = { count: 0, revenue: 0, name: typeName }
    }
    by_purpose[typeName].count++
    by_purpose[typeName].revenue += Number(sale.sale_price) || 0
  })

  const by_source = {}
  salesData.forEach((sale) => {
    const source = sale.sale_source || 'Iska Homes'
    if (!by_source[source]) by_source[source] = { count: 0, revenue: 0 }
    by_source[source].count++
    by_source[source].revenue += Number(sale.sale_price) || 0
  })

  const listingIds = [...new Set(salesData.map((s) => s.listing_id).filter(Boolean))]
  const salesMap = salesData.reduce((acc, sale) => {
    if (!acc[sale.listing_id]) acc[sale.listing_id] = []
    acc[sale.listing_id].push(Number(sale.sale_price) || 0)
    return acc
  }, {})

  const by_type_property = {}
  const by_category = {}
  const by_subtype = {}

  if (listingIds.length > 0) {
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('id, types, categories, listing_types')
      .in('id', listingIds)

    ;(listings || []).forEach((listing) => {
      const salePrices = salesMap[listing.id] || [0]
      const totalPrice = salePrices.reduce((sum, p) => sum + p, 0)

      if (listing.types && Array.isArray(listing.types)) {
        listing.types.forEach((type) => {
          const typeId = typeof type === 'object' ? type.id : type
          const typeName = typeof type === 'object' ? type.name : typeId
          if (!by_type_property[typeId]) {
            by_type_property[typeId] = { count: 0, revenue: 0, name: typeName || typeId }
          }
          by_type_property[typeId].count += salePrices.length
          by_type_property[typeId].revenue += totalPrice
        })
      }

      if (listing.categories && Array.isArray(listing.categories)) {
        listing.categories.forEach((category) => {
          const categoryId = typeof category === 'object' ? category.id : category
          const categoryName = typeof category === 'object' ? category.name : categoryId
          if (!by_category[categoryId]) {
            by_category[categoryId] = { count: 0, revenue: 0, name: categoryName || categoryId }
          }
          by_category[categoryId].count += salePrices.length
          by_category[categoryId].revenue += totalPrice
        })
      }

      if (listing.listing_types?.database && Array.isArray(listing.listing_types.database)) {
        listing.listing_types.database.forEach((subtype) => {
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

    const typeIds = Object.keys(by_type_property).filter(
      (id) => !by_type_property[id].name || by_type_property[id].name === id
    )
    const categoryIds = Object.keys(by_category).filter(
      (id) => !by_category[id].name || by_category[id].name === id
    )
    const subtypeIds = Object.keys(by_subtype).filter(
      (id) => !by_subtype[id].name || by_subtype[id].name === id
    )

    if (typeIds.length > 0 || categoryIds.length > 0 || subtypeIds.length > 0) {
      const [typesResult, categoriesResult, subtypesResult] = await Promise.all([
        typeIds.length > 0
          ? supabaseAdmin.from('property_types').select('id, name').in('id', typeIds)
          : Promise.resolve({ data: [] }),
        categoryIds.length > 0
          ? supabaseAdmin.from('property_categories').select('id, name').in('id', categoryIds)
          : Promise.resolve({ data: [] }),
        subtypeIds.length > 0
          ? supabaseAdmin.from('property_subtypes').select('id, name').in('id', subtypeIds)
          : Promise.resolve({ data: [] })
      ])

      typesResult.data?.forEach((t) => {
        if (by_type_property[t.id]) by_type_property[t.id].name = t.name
      })
      categoriesResult.data?.forEach((c) => {
        if (by_category[c.id]) by_category[c.id].name = c.name
      })
      subtypesResult.data?.forEach((s) => {
        if (by_subtype[s.id]) by_subtype[s.id].name = s.name
      })
    }
  }

  const by_type = { sold: { count: 0, revenue: 0 }, rented: { count: 0, revenue: 0 } }
  salesData.forEach((sale) => {
    const saleType = sale.sale_type || 'sold'
    if (saleType === 'sold' || saleType === 'rented') {
      by_type[saleType].count++
      by_type[saleType].revenue += Number(sale.sale_price) || 0
    }
  })

  return {
    total_sales: salesData.length,
    total_revenue: totalRevenue,
    by_type,
    by_source,
    by_purpose,
    by_type_property,
    by_category,
    by_subtype
  }
}
