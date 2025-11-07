import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch user's subscription requests
export async function GET(request) {
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

    // Get user type and ID
    const userType = decoded.user_type
    const userId = decoded.developer_id || decoded.agent_id || decoded.user_id

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Invalid user information' }, { status: 401 })
    }

    // Map user_type to database format
    const dbUserType = userType === 'developer' ? 'developer' : 
                      userType === 'agent' ? 'agent' : 
                      userType === 'agency' ? 'agency' : null

    if (!dbUserType) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    // Fetch user's subscription requests (most recent first)
    const { data: requests, error } = await supabaseAdmin
      .from('subscriptions_request')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          local_currency_price,
          international_currency_price,
          ideal_duration
        )
      `)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch subscription requests', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: requests || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Create a subscription request (without creating a subscription)
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
    const { package_id } = body

    if (!package_id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // Get user type and ID
    const userType = decoded.user_type
    const userId = decoded.developer_id || decoded.agent_id || decoded.user_id

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Invalid user information' }, { status: 401 })
    }

    // Map user_type to database format
    const dbUserType = userType === 'developer' ? 'developer' : 
                      userType === 'agent' ? 'agent' : 
                      userType === 'agency' ? 'agency' : null

    if (!dbUserType) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    // Fetch user data to determine currency from primary location
    let currency = 'USD' // Default to USD
    if (dbUserType === 'developer') {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('company_locations, default_currency')
        .eq('developer_id', userId)
        .single()

      if (!devError && developer) {
        // Check primary location currency
        if (developer.company_locations) {
          let locations = []
          if (typeof developer.company_locations === 'string') {
            try {
              locations = JSON.parse(developer.company_locations)
            } catch (e) {
              locations = []
            }
          } else {
            locations = developer.company_locations
          }

          const primaryLocation = locations.find(loc => loc.primary_location === true)
          if (primaryLocation && primaryLocation.currency) {
            currency = primaryLocation.currency === 'GHS' ? 'GHS' : 'USD'
          } else if (developer.default_currency) {
            let defaultCurrency = developer.default_currency
            if (typeof defaultCurrency === 'string') {
              try {
                defaultCurrency = JSON.parse(defaultCurrency)
              } catch (e) {
                // Keep as is
              }
            }
            if (defaultCurrency?.code === 'GHS') {
              currency = 'GHS'
            }
          }
        }
      }
    }

    // Fetch package details
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
    }

    // Get monthly price based on currency
    const monthlyPrice = currency === 'GHS' 
      ? parseFloat(packageData.local_currency_price || 0)
      : parseFloat(packageData.international_currency_price || 0)

    // Check if it's a Free plan
    const isFreePlan = packageData.name?.toLowerCase() === 'free' || monthlyPrice === 0

    if (isFreePlan) {
      return NextResponse.json({ error: 'Free plans cannot be requested via manual payment' }, { status: 400 })
    }

    // Calculate duration in months using ideal_duration
    let durationMonths = 1
    if (packageData.ideal_duration && packageData.ideal_duration > 0) {
      durationMonths = packageData.ideal_duration
    } else if (packageData.duration && packageData.span) {
      if (packageData.span === 'month' || packageData.span === 'months') {
        durationMonths = packageData.duration
      } else if (packageData.span === 'year' || packageData.span === 'years') {
        durationMonths = packageData.duration * 12
      }
    }

    // Use total_amount from package if available, otherwise calculate
    const amount = currency === 'GHS'
      ? (packageData.total_amount_ghs || (monthlyPrice * durationMonths))
      : (packageData.total_amount_usd || (monthlyPrice * durationMonths))

    // Get user's current subscription (previous subscription)
    const { data: currentSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .in('status', ['pending', 'active', 'grace_period'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get user's primary billing information
    const { data: billingInfo } = await supabaseAdmin
      .from('billing_information')
      .select('id, preferred_payment_method')
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle()

    // Create subscription request (without creating a subscription)
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('subscriptions_request')
      .insert({
        subscription_id: null, // Keep for backward compatibility
        invoice_id: null, // No invoice created yet
        previous_subscription_id: currentSubscription?.id || null, // Current subscription user has
        next_subscription_id: null, // Will be set when admin approves
        user_id: userId,
        user_type: dbUserType,
        package_id: package_id,
        billing_information_id: billingInfo?.id || null,
        currency,
        amount,
        payment_method: billingInfo?.preferred_payment_method || 'other',
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (requestError) {
      console.error('Subscription request creation error:', requestError)
      return NextResponse.json({ 
        error: 'Failed to create subscription request', 
        details: requestError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: requestData,
      message: 'Subscription request created successfully. Please submit payment proof for admin review.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

