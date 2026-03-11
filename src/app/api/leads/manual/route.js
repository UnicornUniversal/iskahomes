import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'
import { verifyToken } from '@/lib/jwt'

function isUUID(str) {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * GET - Fetch listings and developments for the Add Lead form
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = searchParams.get('lister_type') || 'developer'

    if (!listerId) {
      return NextResponse.json({ error: 'lister_id required' }, { status: 400 })
    }

    let finalListerId = listerId
    if (listerType === 'developer' && !isUUID(listerId)) {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', listerId)
        .single()
      if (developer) finalListerId = developer.developer_id
    }

    const [listingsRes, developmentsRes] = await Promise.all([
      supabaseAdmin
        .from('listings')
        .select('id, title, slug, listing_type')
        .eq('user_id', finalListerId)
        .eq('listing_status', 'active')
        .order('created_at', { ascending: false })
        .limit(100),
      listerType === 'developer'
        ? supabaseAdmin
            .from('developments')
            .select('id, name, slug')
            .eq('developer_id', finalListerId)
            .neq('development_status', 'deleted')
            .order('created_at', { ascending: false })
            .limit(100)
        : { data: [], error: null }
    ])

    return NextResponse.json({
      success: true,
      data: {
        listings: listingsRes.data || [],
        developments: developmentsRes.data || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/leads/manual:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a manual lead
 * Requires: lead_name, lead_email or lead_phone, lead_origin, lister_id, lister_type
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || !decoded.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      lead_name,
      lead_email,
      lead_phone,
      lead_origin,
      listing_id,
      development_id,
      lister_id,
      lister_type,
      notes,
      context_type
    } = body

    if (!lister_id || !lister_type) {
      return NextResponse.json(
        { error: 'Missing required fields: lister_id, lister_type' },
        { status: 400 }
      )
    }

    if (!lead_name || (!lead_email && !lead_phone)) {
      return NextResponse.json(
        { error: 'Name and at least one of email or phone are required' },
        { status: 400 }
      )
    }

    const validOrigins = ['platform', 'their_website', 'referral', 'walk_in', 'phone_call', 'event', 'social_media', 'other']
    if (!lead_origin || !validOrigins.includes(lead_origin)) {
      return NextResponse.json(
        { error: 'Valid lead_origin is required' },
        { status: 400 }
      )
    }

    let finalListerId = lister_id
    if (lister_type === 'developer' && !isUUID(lister_id)) {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', lister_id)
        .single()
      if (developer) finalListerId = developer.developer_id
    }

    const now = new Date()
    const actionDate = now.toISOString().split('T')[0]
    const actionHour = now.getHours()
    const actionTimestamp = now.toISOString()

    const actionObj = {
      action_id: crypto.randomUUID(),
      action_type: 'lead_manual',
      action_date: actionDate.replace(/-/g, ''),
      action_hour: actionHour,
      action_timestamp: actionTimestamp,
      action_metadata: {
        context_type: context_type || (listing_id ? 'listing' : development_id ? 'development' : 'profile'),
        manual_entry: true
      }
    }

    const newLead = {
      seeker_id: null,
      lead_name,
      lead_email: lead_email || null,
      lead_phone: lead_phone || null,
      lead_type: 'manual',
      lead_source: null,
      lead_origin,
      listing_id: listing_id || null,
      development_id: development_id || null,
      lister_id: finalListerId,
      lister_type: lister_type,
      context_type: context_type || (listing_id ? 'listing' : development_id ? 'development' : 'profile'),
      is_anonymous: false,
      lead_actions: [actionObj],
      total_actions: 1,
      lead_score: 10,
      first_action_date: actionDate,
      last_action_date: actionDate,
      last_action_type: 'lead_manual',
      status: 'new',
      status_tracker: ['new'],
      notes: Array.isArray(notes) ? notes : (notes ? [notes] : []),
      date: actionDate,
      hour: actionHour,
      created_at: actionTimestamp,
      updated_at: actionTimestamp
    }

    const { data: createdLead, error: createError } = await supabaseAdmin
      .from('leads')
      .insert(newLead)
      .select()
      .single()

    if (createError) {
      console.error('Error creating manual lead:', createError)
      return NextResponse.json(
        { error: 'Failed to create lead', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: createdLead,
      message: 'Lead created successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/leads/manual:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
