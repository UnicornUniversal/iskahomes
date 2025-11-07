import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// DELETE - Cancel a subscription request (only if pending)
export async function DELETE(request, { params }) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

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

    // Fetch the request to verify ownership and status
    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('subscriptions_request')
      .select('id, user_id, user_type, status')
      .eq('id', id)
      .single()

    if (fetchError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify ownership
    if (requestData.user_id !== userId || requestData.user_type !== dbUserType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow cancellation if status is pending
    if (requestData.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending requests can be cancelled' 
      }, { status: 400 })
    }

    // Delete the request
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions_request')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to cancel request', 
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription request cancelled successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

