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

    // Get user's primary currency (for both developers and agents)
    let primaryCurrency = 'USD' // Default to USD
    console.log(`🔍 Determining primary currency for userId: ${userId}, accountType: ${accountType}`)
    
    if (userId) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        
        if (accountType === 'developer') {
          const { data: profile, error: profileError } = await supabaseAdmin
          .from('developers')
          .select('company_locations, default_currency')
          .eq('developer_id', userId)
          .single()

          if (profileError) {
            console.error('❌ Error fetching developer profile:', profileError)
          }

          if (profile) {
            console.log('📋 Developer profile found:', {
              hasCompanyLocations: !!profile.company_locations,
              hasDefaultCurrency: !!profile.default_currency,
              companyLocationsType: typeof profile.company_locations,
              defaultCurrencyType: typeof profile.default_currency,
              defaultCurrencyValue: profile.default_currency
            })
            
            // Parse company_locations if it's a string (JSONB might be returned as string in some cases)
            let companyLocations = profile.company_locations
            if (typeof companyLocations === 'string') {
              try {
                companyLocations = JSON.parse(companyLocations)
                console.log('✅ Parsed company_locations from string')
              } catch (parseError) {
                console.warn('❌ Failed to parse company_locations as JSON:', parseError)
                companyLocations = null
              }
            }

            // Ensure it's an array (JSONB is usually already an array)
            if (Array.isArray(companyLocations) && companyLocations.length > 0) {
              console.log(`📍 Found ${companyLocations.length} company locations`)
              console.log('📍 Company locations:', JSON.stringify(companyLocations, null, 2))
              
              const primaryLocation = companyLocations.find(
                loc => loc.primary_location === true || loc.primary_location === 'true'
              )
              
              if (primaryLocation) {
                console.log('✅ Found primary location:', {
                  currency: primaryLocation.currency,
                  city: primaryLocation.city,
                  country: primaryLocation.country,
                  primary_location: primaryLocation.primary_location
                })
                if (primaryLocation?.currency) {
                  primaryCurrency = primaryLocation.currency
                  console.log(`✅✅✅ Set primary currency from primary location: ${primaryCurrency}`)
                } else {
                  console.warn('⚠️ Primary location found but has no currency field')
                }
              } else {
                console.warn('⚠️ No primary location found in company_locations')
                console.warn('⚠️ All locations:', companyLocations.map(loc => ({
                  id: loc.id,
                  city: loc.city,
                  primary_location: loc.primary_location,
                  currency: loc.currency
                })))
              }
            }
            
            // ALWAYS check default_currency as fallback if primaryCurrency is still USD
            // This ensures we use default_currency even if company_locations detection failed
            if (primaryCurrency === 'USD' && profile.default_currency) {
              console.log('⚠️ Primary currency is still USD, trying default_currency fallback')
              let defaultCurrency = profile.default_currency
              // default_currency is usually already an object (JSONB), but handle string case
              if (typeof defaultCurrency === 'string') {
                try {
                  defaultCurrency = JSON.parse(defaultCurrency)
                } catch (parseError) {
                  console.warn('Failed to parse default_currency as JSON:', parseError)
                }
              }
              // default_currency is an object like {code: "GHS", name: "Ghanaian Cedi"}
              if (defaultCurrency && typeof defaultCurrency === 'object' && defaultCurrency.code) {
                primaryCurrency = defaultCurrency.code
                console.log(`✅✅✅ Using default_currency as fallback: ${primaryCurrency}`)
              } else {
                console.warn('⚠️ default_currency exists but has no code:', defaultCurrency)
              }
            } else if (!Array.isArray(companyLocations) || companyLocations.length === 0) {
              // Fallback to default_currency if no company_locations array
              if (profile.default_currency) {
                console.log('⚠️ No company_locations array, using default_currency')
                let defaultCurrency = profile.default_currency
                // default_currency is usually already an object (JSONB)
                if (typeof defaultCurrency === 'string') {
                  try {
                    defaultCurrency = JSON.parse(defaultCurrency)
                  } catch (parseError) {
                    console.warn('Failed to parse default_currency as JSON:', parseError)
                  }
                }
                // default_currency is an object like {code: "GHS", name: "Ghanaian Cedi"}
                if (defaultCurrency && typeof defaultCurrency === 'object' && defaultCurrency.code) {
                  primaryCurrency = defaultCurrency.code
                  console.log(`✅✅✅ Using default_currency (no locations): ${primaryCurrency}`)
                } else {
                  console.warn('⚠️ default_currency exists but has no code:', defaultCurrency)
                }
              } else {
                console.warn('⚠️ No company_locations or default_currency found, using USD default')
              }
            }
          } else {
            console.warn('⚠️ Developer profile not found')
          }
        } else if (accountType === 'agent') {
          const { data: agent } = await supabaseAdmin
            .from('agents')
            .select('agency_id, location_id')
            .eq('agent_id', userId)
            .maybeSingle()

          if (agent?.agency_id) {
            const { data: agency } = await supabaseAdmin
              .from('agencies')
              .select('company_locations, default_currency')
              .eq('agency_id', agent.agency_id)
              .maybeSingle()

            if (agency?.company_locations) {
              let companyLocations = agency.company_locations
              if (typeof companyLocations === 'string') {
                try {
                  companyLocations = JSON.parse(companyLocations)
                } catch (parseError) {
                  console.warn('Failed to parse agency company_locations as JSON:', parseError)
                  companyLocations = null
                }
              }

              if (Array.isArray(companyLocations) && companyLocations.length > 0) {
                const assignedLocation = agent.location_id
                  ? companyLocations.find((loc) => loc.id === agent.location_id)
                  : null
                const primaryLocation =
                  assignedLocation ||
                  companyLocations.find(
                    (loc) => loc.primary_location === true || loc.primary_location === 'true'
                  )

                if (primaryLocation?.currency) {
                  primaryCurrency = primaryLocation.currency
                  console.log(`✅ Found agent currency from agency location: ${primaryCurrency}`)
                }
              }
            }

            if (primaryCurrency === 'USD' && agency?.default_currency) {
              let defaultCurrency = agency.default_currency
              if (typeof defaultCurrency === 'string') {
                try {
                  defaultCurrency = JSON.parse(defaultCurrency)
                } catch (parseError) {
                  console.warn('Failed to parse agency default_currency as JSON:', parseError)
                }
              }
              if (defaultCurrency?.code) {
                primaryCurrency = defaultCurrency.code
                console.log(`✅ Using agency default_currency for agent: ${primaryCurrency}`)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user primary currency:', error)
        // Continue with USD default
      }
    }

    console.log(`💰 Primary currency determined: ${primaryCurrency} (accountType: ${accountType})`)
    
    // FINAL VALIDATION: If we still have USD but have userId, something is wrong
    // Try one more time to get default_currency as absolute last resort
    if (primaryCurrency === 'USD' && userId) {
      console.error('❌❌❌ CRITICAL: Primary currency is still USD after detection!')
      console.error('❌ Attempting emergency fallback to default_currency...')
      
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        if (accountType === 'developer') {
          const { data: emergencyProfile } = await supabaseAdmin
            .from('developers')
            .select('default_currency')
            .eq('developer_id', userId)
            .single()
          
          if (emergencyProfile?.default_currency) {
            let emergencyCurrency = emergencyProfile.default_currency
            // default_currency is usually already an object (JSONB)
            if (typeof emergencyCurrency === 'string') {
              try {
                emergencyCurrency = JSON.parse(emergencyCurrency)
              } catch (e) {
                // Ignore parse error
              }
            }
            // default_currency is an object like {code: "GHS", name: "Ghanaian Cedi"}
            if (emergencyCurrency && typeof emergencyCurrency === 'object' && emergencyCurrency.code && emergencyCurrency.code !== 'USD') {
              primaryCurrency = emergencyCurrency.code
              console.error(`✅✅✅ EMERGENCY FALLBACK: Using default_currency ${primaryCurrency}`)
            } else {
              console.error('❌ Emergency fallback failed - default_currency has no valid code:', emergencyCurrency)
            }
          }
        }
      } catch (emergencyError) {
        console.error('❌ Emergency fallback also failed:', emergencyError)
      }
    }

    // Convert to USD (for global_price)
    const [usdPrice, usdEstimatedRevenue] = await Promise.all([
      convertCurrency(price, currency, 'USD'),
      convertCurrency(originalEstimatedRevenue, currency, 'USD')
    ])

    // Convert to primary currency (for estimated_revenue)
    // If listing currency is already the primary currency, no conversion needed
    let primaryPrice = price
    let primaryEstimatedRevenue = originalEstimatedRevenue
    let primaryRate = 1

    if (currency === primaryCurrency) {
      // Listing currency matches primary currency - no conversion needed
      primaryPrice = price
      primaryEstimatedRevenue = originalEstimatedRevenue
      primaryRate = 1
      console.log(`✅ Listing currency (${currency}) matches primary currency - no conversion needed`)
    } else if (primaryCurrency !== 'USD') {
      // Convert from listing currency to primary currency
      console.log(`🔄 Converting from ${currency} to ${primaryCurrency}...`)
      primaryPrice = await convertCurrency(price, currency, primaryCurrency)
      primaryEstimatedRevenue = await convertCurrency(
        originalEstimatedRevenue,
        currency,
        primaryCurrency
      )
      console.log(`✅ Converted: ${price} ${currency} → ${primaryPrice} ${primaryCurrency}`)
      console.log(`✅ Estimated revenue: ${originalEstimatedRevenue} ${currency} → ${primaryEstimatedRevenue} ${primaryCurrency}`)
    } else {
      // If primary is USD, use the USD conversion we already did
      primaryPrice = usdPrice
      primaryEstimatedRevenue = usdEstimatedRevenue
      console.log(`✅ Using USD conversion for primary currency`)
    }

    // Get exchange rates for audit trail
    const [usdRate, primaryRateObj] = await Promise.all([
      fetchExchangeRate(currency, 'USD'),
      currency === primaryCurrency 
        ? Promise.resolve(1) 
        : (primaryCurrency !== 'USD' 
          ? fetchExchangeRate(currency, primaryCurrency) 
          : Promise.resolve(1))
    ])

    // Build estimated_revenue JSONB - MUST be in primary currency
    const estimatedRevenue = {
      currency: primaryCurrency, // This MUST be the user's primary location currency, NOT USD
      price: parseFloat(primaryPrice.toFixed(2)),
      estimated_revenue: parseFloat(primaryEstimatedRevenue.toFixed(2)),
      exchange_rate: parseFloat(primaryRateObj.toFixed(6))
    }

    // Build global_price JSONB - MUST be in USD
    const globalPrice = {
      currency: 'USD', // Always USD for global_price
      price: parseFloat(usdPrice.toFixed(2)),
      estimated_revenue: parseFloat(usdEstimatedRevenue.toFixed(2)),
      exchange_rate: parseFloat(usdRate.toFixed(6))
    }

    console.log(`📊 Currency conversion results:`)
    console.log(`   Primary currency detected: ${primaryCurrency}`)
    console.log(`   Listing currency: ${currency}`)
    console.log(`   estimated_revenue: ${estimatedRevenue.estimated_revenue} ${estimatedRevenue.currency} (SHOULD BE PRIMARY CURRENCY)`)
    console.log(`   global_price: ${globalPrice.estimated_revenue} ${globalPrice.currency} (SHOULD BE USD)`)
    
    // CRITICAL CHECK: If primaryCurrency is still USD but we have a userId, something went wrong
    if (primaryCurrency === 'USD' && userId) {
      console.error('⚠️⚠️⚠️ WARNING: Primary currency is USD but userId exists! This means detection failed!')
      console.error('⚠️ This should NOT happen if company_locations or default_currency is set correctly')
    }

    return {
      estimated_revenue: estimatedRevenue,
      global_price: globalPrice
    }
  } catch (error) {
    console.error('❌ Error processing currency conversions:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      price,
      currency,
      priceType,
      idealDuration,
      timeSpan,
      userId,
      accountType
    })
    
    // Calculate estimated revenue even on error (fallback)
    const fallbackEstimatedRevenue = calculateEstimatedRevenue(price, priceType, idealDuration, timeSpan)
    
    // Try to get primary currency as fallback
    let fallbackPrimaryCurrency = 'USD'
    try {
      if (userId) {
        const { supabaseAdmin } = await import('@/lib/supabase')
        if (accountType === 'developer') {
          const { data: profile } = await supabaseAdmin
            .from('developers')
            .select('company_locations, default_currency')
            .eq('developer_id', userId)
            .single()
          
          if (profile) {
            let companyLocations = profile.company_locations
            if (typeof companyLocations === 'string') {
              companyLocations = JSON.parse(companyLocations)
            }
            if (Array.isArray(companyLocations)) {
              const primaryLocation = companyLocations.find(loc => loc.primary_location === true)
              if (primaryLocation?.currency) {
                fallbackPrimaryCurrency = primaryLocation.currency
              } else if (profile.default_currency) {
                const defaultCurrency = typeof profile.default_currency === 'string' 
                  ? JSON.parse(profile.default_currency) 
                  : profile.default_currency
                if (defaultCurrency?.code) {
                  fallbackPrimaryCurrency = defaultCurrency.code
                }
              }
            }
          }
        }
      }
    } catch (fallbackError) {
      console.error('❌ Error getting fallback primary currency:', fallbackError)
    }
    
    // Return fallback values instead of empty objects
    return {
      estimated_revenue: {
        currency: fallbackPrimaryCurrency,
        price: parseFloat(price.toFixed(2)),
        estimated_revenue: parseFloat(fallbackEstimatedRevenue.toFixed(2)),
        exchange_rate: currency === fallbackPrimaryCurrency ? 1 : null
      },
      global_price: {
        currency: 'USD',
        price: null, // Can't convert without exchange rate
        estimated_revenue: null,
        exchange_rate: null
      }
    }
  }
}

export { convertCurrency, calculateEstimatedRevenue, fetchExchangeRate }

