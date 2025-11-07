import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// POST - Create or update a subscription (admin only)
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
      subscription_id, // If provided, update existing; otherwise create new
      user_id,
      user_type,
      package_id,
      status,
      paid_status,
      start_date,
      end_date,
      grace_period_end_date,
      activated_at,
      cancelled_at,
      cancellation_reason,
      auto_renew,
      currency,
      amount,
      duration_months,
      admin_notes
    } = body

    // Validate required fields
    if (!user_id || !user_type || !package_id) {
      return NextResponse.json({ 
        error: 'user_id, user_type, and package_id are required' 
      }, { status: 400 })
    }

    // Validate user_type
    const validUserTypes = ['developer', 'agent', 'agency']
    if (!validUserTypes.includes(user_type)) {
      return NextResponse.json({ 
        error: 'Invalid user_type. Must be developer, agent, or agency' 
      }, { status: 400 })
    }

    // Fetch package to get default values if needed
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('id', package_id)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Calculate dates if not provided
    const now = new Date()
    const startDate = start_date ? new Date(start_date) : new Date(now)
    let duration = duration_months || 1
    
    let endDate
    if (end_date) {
      endDate = new Date(end_date)
    } else {
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + duration)
    }

    // Calculate grace period end date (end_date + 7 days)
    let gracePeriodEndDate
    if (grace_period_end_date) {
      gracePeriodEndDate = new Date(grace_period_end_date)
    } else {
      gracePeriodEndDate = new Date(endDate)
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7)
    }

    // Determine currency and amount if not provided
    let finalCurrency = currency || 'USD'
    let finalAmount = amount

    if (!finalAmount) {
      // Get user's primary location to determine currency
      if (user_type === 'developer') {
        const { data: developer } = await supabaseAdmin
          .from('developers')
          .select('company_locations, default_currency')
          .eq('developer_id', user_id)
          .single()

        if (developer) {
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
              finalCurrency = primaryLocation.currency === 'GHS' ? 'GHS' : 'USD'
            }
          }
        }
      }

      // Use total_amount from package if available, otherwise calculate
      // Always use ideal_duration if available, as payment is for the full ideal_duration period
      const monthlyPrice = finalCurrency === 'GHS' 
        ? parseFloat(packageData.local_currency_price || 0)
        : parseFloat(packageData.international_currency_price || 0)
      
      // Use ideal_duration from package (this is the minimum payment period)
      const idealDuration = packageData.ideal_duration && packageData.ideal_duration > 0 
        ? packageData.ideal_duration 
        : duration || 1
      
      // Use total_amount from package if available, otherwise calculate
      // Total amount = monthly_price × ideal_duration
      finalAmount = finalCurrency === 'GHS'
        ? (packageData.total_amount_ghs || (monthlyPrice * idealDuration))
        : (packageData.total_amount_usd || (monthlyPrice * idealDuration))
      
      // Update duration_months to match ideal_duration
      if (packageData.ideal_duration && packageData.ideal_duration > 0) {
        duration = packageData.ideal_duration
      }
    }

    const subscriptionData = {
      user_id,
      user_type,
      package_id,
      status: status || 'active',
      paid_status: paid_status || 'pending',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      grace_period_end_date: gracePeriodEndDate.toISOString(),
      activated_at: activated_at ? new Date(activated_at).toISOString() : (status === 'active' ? new Date().toISOString() : null),
      cancelled_at: cancelled_at ? new Date(cancelled_at).toISOString() : null,
      cancellation_reason: cancellation_reason || null,
      auto_renew: auto_renew !== undefined ? auto_renew : false,
      currency: finalCurrency,
      amount: finalAmount,
      duration_months: duration,
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString()
    }

    let subscription
    let isUpdate = false

    if (subscription_id) {
      // Get existing subscription data before updating
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('package_id, status, paid_status')
        .eq('id', subscription_id)
        .single()

      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', subscription_id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update subscription', 
          details: updateError.message 
        }, { status: 500 })
      }

      subscription = updatedSub
      isUpdate = true

      // Determine event type based on what changed (must match allowed event types)
      let eventType = 'activated' // Default
      const metadata = {
        admin_notes: admin_notes || null,
        previous_package_id: existingSub?.package_id || null,
        new_package_id: package_id,
        previous_status: existingSub?.status || null,
        new_status: subscriptionData.status,
        currency: finalCurrency,
        amount: finalAmount,
        duration_months: duration
      }

      if (existingSub) {
        if (existingSub.package_id !== package_id) {
          // Package changed
          if (existingSub.status === 'active' && subscriptionData.status === 'active') {
            eventType = 'upgraded' // Package upgrade while staying active
            metadata.change_type = 'package_upgrade'
          } else {
            eventType = 'upgraded' // Use upgraded for any package change
            metadata.change_type = 'package_change'
          }
        }
        if (existingSub.status !== subscriptionData.status) {
          // Status changed
          if (subscriptionData.status === 'cancelled') {
            eventType = 'cancelled'
            metadata.change_type = 'status_cancelled'
          } else if (subscriptionData.status === 'active' && existingSub.status !== 'active') {
            eventType = 'activated'
            metadata.change_type = 'status_activated'
          } else if (subscriptionData.status === 'suspended') {
            eventType = 'suspended'
            metadata.change_type = 'status_suspended'
          } else if (existingSub.status === 'suspended' && subscriptionData.status === 'active') {
            eventType = 'reactivated'
            metadata.change_type = 'status_reactivated'
          }
        }
        // Track paid_status changes in metadata
        if (existingSub.paid_status !== subscriptionData.paid_status) {
          metadata.previous_paid_status = existingSub.paid_status
          metadata.new_paid_status = subscriptionData.paid_status
          metadata.paid_status_changed = true
        }
        if (existingSub.package_id === package_id && existingSub.status === subscriptionData.status) {
          // Only other fields changed (dates, amount, etc.)
          eventType = 'activated' // Use activated as generic update
          metadata.change_type = 'details_updated'
        }
      }

      // Create history entry with from/to values
      await supabaseAdmin
        .from('subscription_history')
        .insert({
          subscription_id: subscription_id,
          user_id,
          user_type,
          event_type: eventType,
          event_date: new Date().toISOString(),
          from_package_id: existingSub?.package_id || null,
          to_package_id: package_id,
          from_status: existingSub?.status || null,
          to_status: subscriptionData.status,
          reason: 'Admin updated subscription',
          changed_by: 'admin',
          changed_by_user_id: decoded.developer_id || decoded.agent_id || decoded.user_id,
          created_at: new Date().toISOString(),
          metadata: metadata
        })

    } else {
      // Create new subscription
      subscriptionData.created_at = new Date().toISOString()

      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single()

      if (createError) {
        console.error('Create error:', createError)
        return NextResponse.json({ 
          error: 'Failed to create subscription', 
          details: createError.message 
        }, { status: 500 })
      }

      subscription = newSub

      // Create history entry
      await supabaseAdmin
        .from('subscription_history')
        .insert({
          subscription_id: subscription.id,
          user_id,
          user_type,
          event_type: subscriptionData.status === 'active' ? 'activated' : 'created',
          event_date: new Date().toISOString(),
          to_package_id: package_id,
          to_status: subscriptionData.status,
          reason: 'Admin created subscription',
          changed_by: 'admin',
          changed_by_user_id: decoded.developer_id || decoded.agent_id || decoded.user_id,
          created_at: new Date().toISOString(),
          metadata: {
            admin_notes: admin_notes || null,
            package_id: package_id,
            status: subscriptionData.status,
            currency: finalCurrency,
            amount: finalAmount,
            duration_months: duration,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        })
    }

    // Fetch full subscription with package details
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
      .eq('id', subscription.id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
    }

    return NextResponse.json({ 
      success: true,
      data: fullSubscription || subscription,
      message: isUpdate ? 'Subscription updated successfully' : 'Subscription created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

