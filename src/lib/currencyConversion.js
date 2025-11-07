/**
 * Currency Conversion Utility
 * Handles currency conversion using external exchange rate APIs
 */

// Cache exchange rates for 1 hour (3600000 ms)
const RATE_CACHE = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

/**
 * Fetch exchange rate from API
 * Falls back to mock rates if API fails
 */
async function fetchExchangeRate(fromCurrency, toCurrency) {
  // If same currency, return 1
  if (fromCurrency === toCurrency) {
    return 1
  }

  // Check cache first
  const cacheKey = `${fromCurrency}_${toCurrency}`
  const cached = RATE_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }

  try {
    // Try exchangerate-api.com (free tier: 1500 requests/month)
    // Alternative: exchangerate-api.io, fixer.io, currencylayer.com
    const API_KEY = process.env.EXCHANGE_RATE_API_KEY || ''
    
    if (API_KEY) {
      // Using exchangerate-api.com
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}`,
        {
          // Cache for 1 hour (handled by our in-memory cache)
          cache: 'no-store' // Always fetch fresh, but we cache in memory
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.result === 'success' && data.conversion_rate) {
          const rate = data.conversion_rate
          // Cache the rate
          RATE_CACHE.set(cacheKey, { rate, timestamp: Date.now() })
          return rate
        }
      }
    }

    // Fallback to mock rates (for development/testing)
    console.warn(`Using fallback exchange rate for ${fromCurrency} to ${toCurrency}`)
    return getFallbackRate(fromCurrency, toCurrency)
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    // Fallback to mock rates
    return getFallbackRate(fromCurrency, toCurrency)
  }
}

/**
 * Get fallback exchange rates (approximate rates, update as needed)
 * These are example rates - in production, always use a real API
 */
function getFallbackRate(fromCurrency, toCurrency) {
  // Mock rates (as of a typical date - these should be updated periodically)
  // Rates are relative to USD (base currency)
  const ratesToUSD = {
    USD: 1,
    GHS: 0.07,      // 1 USD = ~14.3 GHS
    NGN: 0.0012,    // 1 USD = ~830 NGN
    KES: 0.007,     // 1 USD = ~143 KES
    ZAR: 0.054,     // 1 USD = ~18.5 ZAR
    UGX: 0.00027,   // 1 USD = ~3700 UGX
    TZS: 0.0004,    // 1 USD = ~2500 TZS
    RWF: 0.0008,    // 1 USD = ~1250 RWF
    ETB: 0.018,     // 1 USD = ~55 ETB
    EGP: 0.032,     // 1 USD = ~31 EGP
    XOF: 0.0017,    // 1 USD = ~600 XOF
    XAF: 0.0017,    // 1 USD = ~600 XAF
    EUR: 1.10,       // 1 USD = ~0.91 EUR
    GBP: 1.27,      // 1 USD = ~0.79 GBP
    CAD: 0.74,       // 1 USD = ~1.35 CAD
    AUD: 0.67,       // 1 USD = ~1.50 AUD
    // Add more as needed
  }

  // If converting from USD
  if (fromCurrency === 'USD') {
    return ratesToUSD[toCurrency] || 1
  }

  // If converting to USD
  if (toCurrency === 'USD') {
    return 1 / (ratesToUSD[fromCurrency] || 1)
  }

  // Convert through USD as intermediate
  const fromToUSD = ratesToUSD[fromCurrency] || 1
  const toToUSD = ratesToUSD[toCurrency] || 1
  
  // If we have rates, calculate conversion
  if (fromToUSD !== 1 && toToUSD !== 1) {
    return fromToUSD / toToUSD
  }

  // Default to 1 if we don't have rates
  console.warn(`No exchange rate available for ${fromCurrency} to ${toCurrency}, using 1.0`)
  return 1
}

/**
 * Convert amount from one currency to another
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || amount === 0) return 0
  if (fromCurrency === toCurrency) return amount

  const rate = await fetchExchangeRate(fromCurrency, toCurrency)
  return parseFloat((amount * rate).toFixed(2))
}

/**
 * Calculate estimated revenue based on price and duration
 */
function calculateEstimatedRevenue(price, priceType, idealDuration, timeSpan) {
  if (!price || price === 0) return 0

  // For sale, estimated revenue equals price
  if (priceType === 'sale') {
    return price
  }

  // For rent/lease, calculate: price × ideal_duration
  if (priceType === 'rent' || priceType === 'lease') {
    if (!idealDuration || idealDuration === 0) return price

    // Convert time_span to months if needed
    let durationInMonths = idealDuration
    if (timeSpan === 'years') {
      durationInMonths = idealDuration * 12
    }

    return price * durationInMonths
  }

  return price
}

/**
 * Process currency conversions for a listing
 * Returns: { estimated_revenue, global_price, conversion_rates }
 */
export async function processCurrencyConversions({
  price,
  currency,
  priceType,
  idealDuration,
  timeSpan,
  userId,
  accountType
}) {
  try {
    // Calculate estimated revenue in original currency
    const originalEstimatedRevenue = calculateEstimatedRevenue(
      price,
      priceType,
      idealDuration,
      timeSpan
    )

    // Get developer's primary currency (for developers only)
    let primaryCurrency = 'USD' // Default to USD
    if (accountType === 'developer' && userId) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const { data: profile } = await supabaseAdmin
          .from('developers')
          .select('company_locations, default_currency')
          .eq('user_id', userId)
          .single()

        if (profile?.company_locations) {
          const primaryLocation = profile.company_locations.find(
            loc => loc.primary_location === true
          )
          if (primaryLocation?.currency) {
            primaryCurrency = primaryLocation.currency
          } else if (profile.default_currency?.code) {
            primaryCurrency = profile.default_currency.code
          }
        }
      } catch (error) {
        console.error('Error fetching developer primary currency:', error)
        // Continue with USD default
      }
    }

    // Convert to USD (for global_price)
    const [usdPrice, usdEstimatedRevenue] = await Promise.all([
      convertCurrency(price, currency, 'USD'),
      convertCurrency(originalEstimatedRevenue, currency, 'USD')
    ])

    // Convert to primary currency (for estimated_revenue)
    let primaryPrice = usdPrice
    let primaryEstimatedRevenue = usdEstimatedRevenue
    let primaryRate = 1

    if (primaryCurrency !== 'USD') {
      primaryPrice = await convertCurrency(price, currency, primaryCurrency)
      primaryEstimatedRevenue = await convertCurrency(
        originalEstimatedRevenue,
        currency,
        primaryCurrency
      )
    } else {
      // If primary is USD, use the USD conversion we already did
      primaryPrice = usdPrice
      primaryEstimatedRevenue = usdEstimatedRevenue
    }

    // Get exchange rates for audit trail
    const [usdRate, primaryRateObj] = await Promise.all([
      fetchExchangeRate(currency, 'USD'),
      primaryCurrency !== 'USD' ? fetchExchangeRate(currency, primaryCurrency) : Promise.resolve(1)
    ])

    // Build estimated_revenue JSONB
    const estimatedRevenue = {
      currency: primaryCurrency,
      price: parseFloat(primaryPrice.toFixed(2)),
      estimated_revenue: parseFloat(primaryEstimatedRevenue.toFixed(2)),
      exchange_rate: parseFloat(primaryRateObj.toFixed(6))
    }

    // Build global_price JSONB
    const globalPrice = {
      currency: 'USD',
      price: parseFloat(usdPrice.toFixed(2)),
      estimated_revenue: parseFloat(usdEstimatedRevenue.toFixed(2)),
      exchange_rate: parseFloat(usdRate.toFixed(6))
    }

    return {
      estimated_revenue: estimatedRevenue,
      global_price: globalPrice
    }
  } catch (error) {
    console.error('Error processing currency conversions:', error)
    // Return empty objects on error
    return {
      estimated_revenue: {},
      global_price: {}
    }
  }
}

export { convertCurrency, calculateEstimatedRevenue, fetchExchangeRate }

