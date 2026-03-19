import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

const ALLOWED_API_LIMIT_DATA_TYPES = ['number', 'text']
const VALID_SUBSCRIPTION_TYPES = ['package', 'addon']

function normalizeApiLimits(apiLimitsInput) {
  if (!apiLimitsInput) return {}

  const result = {}

  // Preferred format: object map keyed by limit name
  if (typeof apiLimitsInput === 'object' && !Array.isArray(apiLimitsInput)) {
    for (const [rawName, rawConfig] of Object.entries(apiLimitsInput)) {
      const name = String(rawName || '').trim()
      if (!name || typeof rawConfig !== 'object' || rawConfig === null) continue

      const dataType = String(rawConfig.data_type || '').toLowerCase().trim()
      if (!ALLOWED_API_LIMIT_DATA_TYPES.includes(dataType)) continue

      if (dataType === 'number') {
        const parsedNumber = Number(rawConfig.value)
        if (Number.isFinite(parsedNumber)) {
          result[name] = { data_type: 'number', value: parsedNumber }
        }
      } else {
        result[name] = { data_type: 'text', value: String(rawConfig.value ?? '') }
      }
    }
    return result
  }

  // Backward-compatible format: array of {name, data_type, value}
  if (Array.isArray(apiLimitsInput)) {
    for (const item of apiLimitsInput) {
      if (!item || typeof item !== 'object') continue
      const name = String(item.name || '').trim()
      const dataType = String(item.data_type || '').toLowerCase().trim()

      if (!name || !ALLOWED_API_LIMIT_DATA_TYPES.includes(dataType)) continue

      if (dataType === 'number') {
        const parsedNumber = Number(item.value)
        if (Number.isFinite(parsedNumber)) {
          result[name] = { data_type: 'number', value: parsedNumber }
        }
      } else {
        result[name] = { data_type: 'text', value: String(item.value ?? '') }
      }
    }
  }

  return result
}

// GET - Fetch all subscription packages
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    // Check if user is admin (you may want to add admin check here)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch all packages sorted in DB:
    // 1) developers first
    // 2) highest local_currency_price first
    // SQL equivalent:
    // SELECT * FROM subscriptions_package
    // ORDER BY
    //   CASE WHEN user_type = 'developers' THEN 0 ELSE 1 END ASC,
    //   local_currency_price DESC,
    //   created_at DESC;
    const { data: packages, error } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .order('user_type', { ascending: false, nullsFirst: false })
      .order('local_currency_price', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch packages', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: packages || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Create a new subscription package
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      features,
      api_limits,
      local_currency_price,
      international_currency_price,
      duration,
      span,
      display_text,
      ideal_duration,
      subscriptions_type,
      user_type,
      is_active = true
    } = body

    // Validation
    if (!name || local_currency_price === undefined || local_currency_price === null || international_currency_price === undefined || international_currency_price === null) {
      return NextResponse.json({ 
        error: 'Name, local currency price, and international currency price are required' 
      }, { status: 400 })
    }

    // For free plans (price = 0), duration and span are optional
    const isFreePlan = parseFloat(local_currency_price) === 0 && parseFloat(international_currency_price) === 0
    
    if (!isFreePlan && (!duration || !span)) {
      return NextResponse.json({ 
        error: 'Duration and span are required for paid plans' 
      }, { status: 400 })
    }

    // Validate span values (only if provided)
    if (span) {
      const validSpans = ['month', 'months', 'year', 'years']
      if (!validSpans.includes(span)) {
        return NextResponse.json({ 
          error: 'Span must be one of: month, months, year, years' 
        }, { status: 400 })
      }
    }

    // Validate user_type (optional for free plans, but if provided must be valid)
    let userTypeLower = null
    if (user_type) {
      const validUserTypes = ['developers', 'agents', 'agencies', 'all']
      userTypeLower = user_type.toLowerCase()
      if (!validUserTypes.includes(userTypeLower)) {
        return NextResponse.json({ 
          error: 'User type must be one of: developers, agents, agencies, all' 
        }, { status: 400 })
      }
    }

    // Validate subscriptions_type if provided
    const normalizedSubscriptionType = subscriptions_type
      ? String(subscriptions_type).toLowerCase()
      : 'package'
    if (!VALID_SUBSCRIPTION_TYPES.includes(normalizedSubscriptionType)) {
      return NextResponse.json({
        error: 'subscriptions_type must be one of: package, addon'
      }, { status: 400 })
    }

    // Ensure features is an array and validate structure
    let featuresArray = Array.isArray(features) ? features : []
    
    // Validate and normalize features format
    featuresArray = featuresArray.map(feature => {
      // If it's already an object with feature_name and feature_value, use it
      if (typeof feature === 'object' && feature !== null && feature.feature_name) {
        return {
          feature_name: String(feature.feature_name || '').trim(),
          feature_value: String(feature.feature_value || '').trim()
        }
      }
      // If it's a string (old format), convert to object
      if (typeof feature === 'string') {
        return {
          feature_name: feature.trim(),
          feature_value: ''
        }
      }
      // Default fallback
      return {
        feature_name: '',
        feature_value: ''
      }
    }).filter(f => f.feature_name) // Remove empty features
    const normalizedApiLimits = normalizeApiLimits(api_limits)

    // Calculate total amounts: ideal_duration * monthly_price
    const parsedLocalPrice = parseFloat(local_currency_price)
    const parsedInternationalPrice = parseFloat(international_currency_price)
    const parsedIdealDuration = ideal_duration ? parseInt(ideal_duration) : 1
    
    // Total amount = ideal_duration * monthly_price (or just monthly_price if ideal_duration is not set)
    const totalAmountGHS = parsedIdealDuration > 0 
      ? parsedIdealDuration * parsedLocalPrice 
      : parsedLocalPrice
    const totalAmountUSD = parsedIdealDuration > 0 
      ? parsedIdealDuration * parsedInternationalPrice 
      : parsedInternationalPrice

    // Create package
    const { data: newPackage, error } = await supabaseAdmin
      .from('subscriptions_package')
      .insert([{
        name,
        description: description || null,
        features: featuresArray,
        api_limits: normalizedApiLimits,
        local_currency: 'GHS', // Non-negotiable
        local_currency_price: parsedLocalPrice,
        international_currency: 'USD', // Non-negotiable
        international_currency_price: parsedInternationalPrice,
        duration: duration ? parseInt(duration) : null,
        span: span || null,
        display_text: display_text || null,
        ideal_duration: parsedIdealDuration > 0 ? parsedIdealDuration : null,
        subscriptions_type: normalizedSubscriptionType,
        user_type: userTypeLower || null,
        is_active: is_active !== false,
        total_amount_usd: totalAmountUSD,
        total_amount_ghs: totalAmountGHS
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to create package', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: newPackage,
      message: 'Package created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

