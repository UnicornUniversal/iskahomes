import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch user's billing information
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

    // Get billing information
    const { data: billingInfo, error } = await supabaseAdmin
      .from('billing_information')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', dbUserType)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch billing information', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: billingInfo || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Create billing information
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
      preferred_payment_method,
      mobile_money_provider,
      mobile_money_number,
      mobile_money_account_name,
      bank_name,
      bank_account_number,
      bank_account_name,
      bank_branch,
      bank_swift_code,
      billing_email,
      billing_phone,
      billing_address,
      is_primary = true
    } = body

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

    // If this is set as primary, unset other primary records
    if (is_primary) {
      await supabaseAdmin
        .from('billing_information')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('user_type', dbUserType)
        .eq('is_primary', true)
    }

    // Create billing information
    const { data: billingInfo, error } = await supabaseAdmin
      .from('billing_information')
      .insert({
        user_id: userId,
        user_type: dbUserType,
        preferred_payment_method,
        mobile_money_provider,
        mobile_money_number,
        mobile_money_account_name,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_branch,
        bank_swift_code,
        billing_email,
        billing_phone,
        billing_address,
        is_primary,
        is_verified: false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to create billing information', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: billingInfo,
      message: 'Billing information created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update billing information
export async function PUT(request) {
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Billing information ID is required' }, { status: 400 })
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

    // Verify the billing info belongs to the user
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('billing_information')
      .select('id, user_id, user_type')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Billing information not found' }, { status: 404 })
    }

    if (existing.user_id !== userId || existing.user_type !== dbUserType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If setting as primary, unset other primary records
    if (updates.is_primary === true) {
      await supabaseAdmin
        .from('billing_information')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('user_type', dbUserType)
        .eq('is_primary', true)
        .neq('id', id)
    }

    // Update billing information
    const { data: billingInfo, error } = await supabaseAdmin
      .from('billing_information')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to update billing information', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: billingInfo,
      message: 'Billing information updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

