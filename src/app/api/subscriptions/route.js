import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch user's current subscription
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

    // Determine currency from user's primary location
    let currency = 'USD' // Default to USD
    if (dbUserType === 'developer') {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('company_locations, default_currency')
        .eq('developer_id', userId)
        .single()

      if (developer) {
        let locations = []
        if (developer.company_locations) {
          if (typeof developer.company_locations === 'string') {
            try {
              locations = JSON.parse(developer.company_locations)
            } catch (e) {
              locations = []
            }
          } else {
            locations = developer.company_locations
          }
        }

        const primaryLocation = Array.isArray(locations) 
          ? locations.find(loc => loc.primary_location === true)
          : null

        if (primaryLocation) {
          if (primaryLocation.country?.toLowerCase() === 'ghana' || 
              primaryLocation.currency === 'GHS') {
            currency = 'GHS'
          } else {
            currency = 'USD'
          }
        } else if (developer.default_currency) {
          try {
            const defaultCurrency = typeof developer.default_currency === 'string'
              ? JSON.parse(developer.default_currency)
              : developer.default_currency
            if (defaultCurrency?.code === 'GHS') {
              currency = 'GHS'
            }
          } catch (e) {
            if (developer.default_currency === 'GHS' || developer.default_currency?.includes('GHS')) {
              currency = 'GHS'
            }
          }
        }
      }
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          description,
          features,
          local_currency_price,
          international_currency_price,
          duration,
          span,
          display_text
        )
      `)
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .in('status', ['pending', 'active', 'grace_period'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error('Database error:', subError)
      return NextResponse.json({ 
        error: 'Failed to fetch subscription', 
        details: subError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: subscription || null,
      currency: currency // Return determined currency
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Create/Select a subscription package
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
    const { package_id, payment_method } = body

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
        // Parse company_locations if it's a string
        let locations = []
        if (developer.company_locations) {
          if (typeof developer.company_locations === 'string') {
            try {
              locations = JSON.parse(developer.company_locations)
            } catch (e) {
              locations = []
            }
          } else {
            locations = developer.company_locations
          }
        }

        // Find primary location
        const primaryLocation = Array.isArray(locations) 
          ? locations.find(loc => loc.primary_location === true)
          : null

        if (primaryLocation) {
          // If country is Ghana or currency is GHS, use GHS
          if (primaryLocation.country?.toLowerCase() === 'ghana' || 
              primaryLocation.currency === 'GHS') {
            currency = 'GHS'
          } else {
            currency = 'USD'
          }
        } else if (developer.default_currency) {
          // Fallback to default_currency
          try {
            const defaultCurrency = typeof developer.default_currency === 'string'
              ? JSON.parse(developer.default_currency)
              : developer.default_currency
            if (defaultCurrency?.code === 'GHS') {
              currency = 'GHS'
            }
          } catch (e) {
            // If parsing fails, check if it's a simple string
            if (developer.default_currency === 'GHS' || developer.default_currency?.includes('GHS')) {
              currency = 'GHS'
            }
          }
        }
      }
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
    }

    // Check if package is for correct user type
    if (packageData.user_type && packageData.user_type !== dbUserType + 's') {
      return NextResponse.json({ 
        error: 'This package is not available for your user type' 
      }, { status: 400 })
    }

    // Calculate subscription dates
    const now = new Date()
    const startDate = new Date(now)
    
    // Get monthly price based on currency first (needed to check if Free plan)
    const monthlyPrice = currency === 'GHS' 
      ? parseFloat(packageData.local_currency_price || 0)
      : parseFloat(packageData.international_currency_price || 0)

    // Check if it's a Free plan (must be defined before duration calculation)
    const isFreePlan = packageData.name?.toLowerCase() === 'free' || monthlyPrice === 0
    
    // Calculate duration in months using ideal_duration
    // ideal_duration is the minimum payment period (e.g., 3 months)
    let durationMonths = 1
    if (isFreePlan) {
      // Free plan has no expiration - set to 100 years (effectively unlimited)
      durationMonths = 1200
    } else if (packageData.ideal_duration && packageData.ideal_duration > 0) {
      // Use ideal_duration as the subscription duration
      durationMonths = packageData.ideal_duration
    } else if (packageData.duration && packageData.span) {
      // Fallback to duration/span if ideal_duration is not set
      if (packageData.span === 'month' || packageData.span === 'months') {
        durationMonths = packageData.duration
      } else if (packageData.span === 'year' || packageData.span === 'years') {
        durationMonths = packageData.duration * 12
      }
    }

    // Use total_amount from package if available, otherwise calculate
    // Total amount = ideal_duration * monthly_price (or duration if ideal_duration not set)
    const amount = isFreePlan ? 0 : (
      currency === 'GHS'
        ? (packageData.total_amount_ghs || (monthlyPrice * durationMonths))
        : (packageData.total_amount_usd || (monthlyPrice * durationMonths))
    )

    // Calculate end date
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + durationMonths)
    
    // Calculate grace period end date (end_date + 7 days)
    const gracePeriodEndDate = new Date(endDate)
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7)

    // Check if user has an existing active subscription
    const { data: existingSub, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, package_id')
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .in('status', ['pending', 'active', 'grace_period'])
      .maybeSingle()

    let subscriptionId
    let subscriptionData

    // Determine initial status based on payment method
    let initialStatus = 'pending'
    if (isFreePlan || payment_method === 'free') {
      initialStatus = 'active'
    }

    if (existingSub) {
      // Update existing subscription (upgrade/downgrade)
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          package_id,
          status: initialStatus,
          currency,
          amount,
          duration_months: durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          grace_period_end_date: gracePeriodEndDate.toISOString(),
          activated_at: initialStatus === 'active' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update subscription', 
          details: updateError.message 
        }, { status: 500 })
      }

      subscriptionId = updatedSub.id
      subscriptionData = updatedSub

      // Create history entry for upgrade/downgrade
      const fromPackageId = existingSub.package_id
      await supabaseAdmin
        .from('subscription_history')
        .insert({
          subscription_id: subscriptionId,
          user_id: userId,
          user_type: dbUserType,
          event_type: fromPackageId !== package_id ? 'upgraded' : 'renewed',
          event_date: new Date().toISOString(),
          from_package_id: fromPackageId,
          to_package_id: package_id,
          from_status: existingSub.status,
          to_status: initialStatus,
          reason: fromPackageId !== package_id ? 'User changed subscription plan' : 'User renewed subscription',
          changed_by: 'user',
          changed_by_user_id: userId
        })

    } else {
      // Create new subscription
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          user_type: dbUserType,
          package_id,
          status: initialStatus,
          currency,
          amount,
          duration_months: durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          grace_period_end_date: gracePeriodEndDate.toISOString(),
          activated_at: initialStatus === 'active' ? new Date().toISOString() : null,
          auto_renew: false
        })
        .select()
        .single()

      if (createError) {
        console.error('Create error:', createError)
        return NextResponse.json({ 
          error: 'Failed to create subscription', 
          details: createError.message 
        }, { status: 500 })
      }

      subscriptionId = newSub.id
      subscriptionData = newSub

      // Create history entry
      await supabaseAdmin
        .from('subscription_history')
        .insert({
          subscription_id: subscriptionId,
          user_id: userId,
          user_type: dbUserType,
          event_type: initialStatus === 'active' ? 'activated' : 'created',
          event_date: new Date().toISOString(),
          to_package_id: package_id,
          to_status: initialStatus,
          reason: isFreePlan ? 'User selected free plan' : 'User selected subscription package',
          changed_by: 'user',
          changed_by_user_id: userId
        })
    }

    // Create invoice for the subscription (skip for free plans)
    let invoice = null
    if (!isFreePlan) {
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      
      const { data: invoiceData, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          subscription_id: subscriptionId,
          user_id: userId,
          user_type: dbUserType,
          invoice_date: new Date().toISOString(),
          due_date: endDate.toISOString(),
          currency,
          amount,
          tax_amount: 0,
          total_amount: amount,
          payment_status: initialStatus === 'active' ? 'paid' : 'pending',
          billing_period_start: startDate.toISOString(),
          billing_period_end: endDate.toISOString()
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError)
        // Don't fail the subscription creation if invoice fails
      } else {
        invoice = invoiceData
      }
    }

    // Create subscription request for manual payment
    let subscriptionRequest = null
    if (payment_method === 'manual' && !isFreePlan && invoice) {
      // Get user's primary billing information
      const { data: billingInfo } = await supabaseAdmin
        .from('billing_information')
        .select('id, preferred_payment_method')
        .eq('user_id', userId)
        .eq('user_type', dbUserType)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle()

      const { data: requestData, error: requestError } = await supabaseAdmin
        .from('subscriptions_request')
        .insert({
          subscription_id: subscriptionId,
          invoice_id: invoice.id,
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
        // Don't fail the subscription creation if request fails
      } else {
        subscriptionRequest = requestData
      }
    }

    // Fetch subscription with package details
    const { data: fullSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscriptions_package:package_id (
          id,
          name,
          description,
          features,
          local_currency_price,
          international_currency_price,
          duration,
          span,
          display_text
        )
      `)
      .eq('id', subscriptionId)
      .single()

    let message = 'Subscription created successfully.'
    if (isFreePlan) {
      message = 'Free plan activated successfully!'
    } else if (payment_method === 'manual') {
      message = 'Subscription request created. Please submit payment proof for admin review.'
    } else {
      message = 'Subscription created successfully. Payment pending admin confirmation.'
    }

    return NextResponse.json({ 
      success: true,
      data: fullSubscription,
      invoice: invoice || null,
      subscription_request: subscriptionRequest || null,
      message
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

