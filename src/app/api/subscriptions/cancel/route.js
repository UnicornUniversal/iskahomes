import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// POST - Cancel subscription (creates request, moves to free plan)
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

    const body = await request.json()
    const { cancellation_reason } = body

    // Get user's current active subscription
    const { data: currentSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, package_id, status')
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .in('status', ['pending', 'active', 'grace_period'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ 
        error: 'Failed to fetch subscription', 
        details: subError.message 
      }, { status: 500 })
    }

    if (!currentSubscription) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 404 })
    }

    // Find the Free plan
    const { data: freePlan, error: freePlanError } = await supabaseAdmin
      .from('subscriptions_package')
      .select('id, name')
      .or('name.ilike.%free%,local_currency_price.eq.0,international_currency_price.eq.0')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (freePlanError || !freePlan) {
      return NextResponse.json({ 
        error: 'Free plan not found. Please contact support.' 
      }, { status: 404 })
    }

    // Create subscription request for cancellation
    const { data: cancelRequest, error: requestError } = await supabaseAdmin
      .from('subscriptions_request')
      .insert({
        subscription_id: null,
        invoice_id: null,
        previous_subscription_id: currentSubscription.id,
        next_subscription_id: null, // Will be set when admin processes
        user_id: userId,
        user_type: dbUserType,
        package_id: freePlan.id, // Moving to free plan
        billing_information_id: null,
        currency: 'USD',
        amount: 0,
        payment_method: 'free',
        status: 'pending',
        requested_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || null
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating cancel request:', requestError)
      return NextResponse.json({ 
        error: 'Failed to create cancellation request', 
        details: requestError.message 
      }, { status: 500 })
    }

    // Create subscription history entry
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        subscription_id: currentSubscription.id,
        user_id: userId,
        user_type: dbUserType,
        event_type: 'cancelled',
        event_date: new Date().toISOString(),
        from_package_id: currentSubscription.package_id,
        to_package_id: freePlan.id,
        from_status: currentSubscription.status,
        to_status: 'pending',
        reason: cancellation_reason || 'User requested cancellation',
        changed_by: 'user',
        changed_by_user_id: userId,
        created_at: new Date().toISOString(),
        metadata: {
          request_id: cancelRequest.id,
          cancellation_type: 'user_requested',
          cancellation_reason: cancellation_reason || null
        }
      })

    return NextResponse.json({ 
      success: true,
      data: cancelRequest,
      message: 'Cancellation request submitted successfully. Your subscription will be moved to the free plan after admin approval.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

