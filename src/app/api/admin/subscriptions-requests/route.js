import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch all subscription requests (admin only)
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userType = searchParams.get('user_type')

    // Build query
    let query = supabaseAdmin
      .from('subscriptions_request')
      .select(`
        *,
        subscriptions:subscription_id (
          id,
          status,
          user_id,
          user_type
        ),
        invoices:invoice_id (
          id,
          invoice_number,
          total_amount,
          currency
        ),
        subscriptions_package:package_id (
          id,
          name
        ),
        billing_information:billing_information_id (
          id,
          preferred_payment_method,
          mobile_money_number,
          bank_account_number
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (userType) {
      query = query.eq('user_type', userType)
    }

    // Order and execute
    const { data: requests, error } = await query
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch subscription requests', 
        details: error.message 
      }, { status: 500 })
    }

    // Fetch user information based on user_type and merge
    if (requests && requests.length > 0) {
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          let userInfo = null

          try {
            if (request.user_type === 'developer') {
              const { data: developer } = await supabaseAdmin
                .from('developers')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', request.user_id)
                .single()
              
              if (developer) {
                userInfo = {
                  id: developer.id,
                  name: developer.name,
                  profile_image: developer.profile_image,
                  user_id: developer.developer_id
                }
              }
            } else if (request.user_type === 'agent') {
              const { data: agent } = await supabaseAdmin
                .from('agents')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', request.user_id)
                .single()
              
              if (agent) {
                userInfo = {
                  id: agent.id,
                  name: agent.name,
                  profile_image: agent.profile_image,
                  user_id: agent.developer_id
                }
              }
            } else if (request.user_type === 'agency') {
              const { data: agency } = await supabaseAdmin
                .from('agencies')
                .select('id, name, profile_image, developer_id')
                .eq('developer_id', request.user_id)
                .single()
              
              if (agency) {
                userInfo = {
                  id: agency.id,
                  name: agency.name,
                  profile_image: agency.profile_image,
                  user_id: agency.developer_id
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching user info for ${request.user_type}:`, err)
          }

          return {
            ...request,
            user: userInfo
          }
        })
      )

      return NextResponse.json({ 
        success: true,
        data: requestsWithUsers
      })
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

// PUT - Update subscription request status (approve/reject)
export async function PUT(request) {
  try {
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
    const { request_id, action, rejection_reason, admin_notes } = body

    if (!request_id || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve, reject, or cancel' }, { status: 400 })
    }

    // Get the request first
    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('subscriptions_request')
      .select('*, subscriptions:subscription_id(*)')
      .eq('id', request_id)
      .single()

    if (fetchError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const adminId = decoded.user_id || decoded.developer_id || decoded.agent_id
    const updateData = {
      admin_notes: admin_notes || requestData.admin_notes
    }

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = adminId

      // Fetch package details to calculate dates and amounts
      const { data: packageData } = await supabaseAdmin
        .from('subscriptions_package')
        .select('*')
        .eq('id', requestData.package_id)
        .single()

      if (!packageData) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }

      // Calculate subscription dates
      const now = new Date()
      const startDate = new Date(now)
      
      // Get duration from package or request
      let durationMonths = requestData.duration_months || 1
      if (packageData.ideal_duration && packageData.ideal_duration > 0) {
        durationMonths = packageData.ideal_duration
      } else if (packageData.duration && packageData.span) {
        if (packageData.span === 'month' || packageData.span === 'months') {
          durationMonths = packageData.duration
        } else if (packageData.span === 'year' || packageData.span === 'years') {
          durationMonths = packageData.duration * 12
        }
      }

      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + durationMonths)
      
      const gracePeriodEndDate = new Date(endDate)
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7)

      // Check if user already has an active subscription
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status, package_id')
        .eq('user_id', requestData.user_id)
        .eq('user_type', requestData.user_type)
        .in('status', ['pending', 'active', 'grace_period'])
        .maybeSingle()

      let subscriptionId
      let invoiceId

      if (existingSub) {
        // Update existing subscription
        const { data: updatedSub, error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            package_id: requestData.package_id,
            status: 'active',
            currency: requestData.currency,
            amount: requestData.amount,
            duration_months: durationMonths,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            grace_period_end_date: gracePeriodEndDate.toISOString(),
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return NextResponse.json({ 
            error: 'Failed to update subscription', 
            details: updateError.message 
          }, { status: 500 })
        }

        subscriptionId = updatedSub.id

        // Create history entry
        await supabaseAdmin
          .from('subscription_history')
          .insert({
            subscription_id: subscriptionId,
            user_id: requestData.user_id,
            user_type: requestData.user_type,
            event_type: 'upgraded',
            event_date: new Date().toISOString(),
            from_package_id: existingSub.package_id,
            to_package_id: requestData.package_id,
            from_status: existingSub.status,
            to_status: 'active',
            reason: 'Admin approved subscription request',
            changed_by: 'admin',
            changed_by_user_id: adminId,
            created_at: new Date().toISOString(),
            metadata: {
              request_id: request_id,
              previous_subscription_id: existingSub.id,
              currency: requestData.currency,
              amount: requestData.amount,
              duration_months: durationMonths,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString()
            }
          })

      } else {
        // Create new subscription
        const { data: newSub, error: createError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: requestData.user_id,
            user_type: requestData.user_type,
            package_id: requestData.package_id,
            status: 'active',
            currency: requestData.currency,
            amount: requestData.amount,
            duration_months: durationMonths,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            grace_period_end_date: gracePeriodEndDate.toISOString(),
            activated_at: new Date().toISOString(),
            auto_renew: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating subscription:', createError)
          return NextResponse.json({ 
            error: 'Failed to create subscription', 
            details: createError.message 
          }, { status: 500 })
        }

        subscriptionId = newSub.id

        // Create history entry
        await supabaseAdmin
          .from('subscription_history')
          .insert({
            subscription_id: subscriptionId,
            user_id: requestData.user_id,
            user_type: requestData.user_type,
            event_type: 'activated',
            event_date: new Date().toISOString(),
            to_package_id: requestData.package_id,
            to_status: 'active',
            reason: 'Admin approved subscription request',
            changed_by: 'admin',
            changed_by_user_id: adminId,
            created_at: new Date().toISOString(),
            metadata: {
              request_id: request_id,
              previous_subscription_id: requestData.previous_subscription_id || null,
              currency: requestData.currency,
              amount: requestData.amount,
              duration_months: durationMonths,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString()
            }
          })
      }

      // Create invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      const { data: invoiceData, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          subscription_id: subscriptionId,
          user_id: requestData.user_id,
          user_type: requestData.user_type,
          invoice_date: new Date().toISOString(),
          due_date: endDate.toISOString(),
          currency: requestData.currency,
          amount: requestData.amount,
          tax_amount: 0,
          total_amount: requestData.amount,
          payment_status: 'paid',
          billing_period_start: startDate.toISOString(),
          billing_period_end: endDate.toISOString()
        })
        .select()
        .single()

      if (!invoiceError && invoiceData) {
        invoiceId = invoiceData.id
      }

      // Update request with subscription and invoice IDs
      updateData.next_subscription_id = subscriptionId
      updateData.subscription_id = subscriptionId
      updateData.invoice_id = invoiceId

    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_at = new Date().toISOString()
      updateData.rejected_by = adminId
      updateData.rejection_reason = rejection_reason || 'Payment verification failed'
    } else if (action === 'cancel') {
      updateData.status = 'cancelled'
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = adminId
    }

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('subscriptions_request')
      .update(updateData)
      .eq('id', request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update request', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: updatedRequest,
      message: `Request ${action}d successfully`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

