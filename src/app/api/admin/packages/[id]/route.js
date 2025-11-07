import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch a single package
export async function GET(request, { params }) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
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

    // Fetch package
    const { data: pkg, error } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch package', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: pkg
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update a subscription package
export async function PUT(request, { params }) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
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

    const body = await request.json()
    const {
      name,
      description,
      features,
      local_currency_price,
      international_currency_price,
      duration,
      span,
      display_text,
      ideal_duration,
      user_type,
      is_active
    } = body

    // Validation
    if (!name || local_currency_price === undefined || international_currency_price === undefined) {
      return NextResponse.json({ 
        error: 'Name, local currency price, and international currency price are required' 
      }, { status: 400 })
    }

    if (duration && !span) {
      return NextResponse.json({ 
        error: 'Span is required when duration is provided' 
      }, { status: 400 })
    }

    if (span && !duration) {
      return NextResponse.json({ 
        error: 'Duration is required when span is provided' 
      }, { status: 400 })
    }

    // Validate span values if provided
    if (span) {
      const validSpans = ['month', 'months', 'year', 'years']
      if (!validSpans.includes(span)) {
        return NextResponse.json({ 
          error: 'Span must be one of: month, months, year, years' 
        }, { status: 400 })
      }
    }

    // Validate user_type if provided
    let userTypeLower = null
    if (user_type) {
      const validUserTypes = ['developers', 'agents', 'agencies']
      userTypeLower = user_type.toLowerCase()
      if (!validUserTypes.includes(userTypeLower)) {
        return NextResponse.json({ 
          error: 'User type must be one of: developers, agents, agencies' 
        }, { status: 400 })
      }
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

    // Build update object
    const updateData = {
      name,
      description: description || null,
      features: featuresArray,
      local_currency: 'GHS', // Non-negotiable
      local_currency_price: parsedLocalPrice,
      international_currency: 'USD', // Non-negotiable
      international_currency_price: parsedInternationalPrice,
      duration: duration ? parseInt(duration) : null,
      span: span || null,
      display_text: display_text || null,
      ideal_duration: parsedIdealDuration > 0 ? parsedIdealDuration : null,
      user_type: userTypeLower || undefined,
      is_active: is_active !== undefined ? is_active : true,
      total_amount_usd: totalAmountUSD,
      total_amount_ghs: totalAmountGHS
    }

    // Update package
    const { data: updatedPackage, error } = await supabaseAdmin
      .from('subscriptions_package')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to update package', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: updatedPackage,
      message: 'Package updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Delete a subscription package
export async function DELETE(request, { params }) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
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

    // Delete package
    const { error } = await supabaseAdmin
      .from('subscriptions_package')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete package', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Package deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

