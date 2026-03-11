import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users?type=developer|agent|agency|property_seeker&search=&status=&page=1&limit=20
 * List users - public info only, no analytics
 * No auth for now
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'developer'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const offset = (page - 1) * limit

    const validTypes = ['developer', 'agent', 'agency', 'property_seeker']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    let query = supabaseAdmin.from(getTableName(type)).select('*', { count: 'exact' })

    // Apply filters based on type
    if (type === 'developer') {
      if (status !== 'all') {
        if (status === 'verified') query = query.eq('verified', true)
        else if (status === 'pending') query = query.eq('verified', false)
        else query = query.eq('account_status', status)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }
    } else if (type === 'agent') {
      if (status !== 'all') {
        if (status === 'verified') query = query.eq('verified', true)
        else if (status === 'pending') query = query.eq('verified', false)
        else query = query.eq('account_status', status)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }
    } else if (type === 'agency') {
      if (status !== 'all') {
        if (status === 'verified') query = query.eq('verified', true)
        else if (status === 'pending') query = query.eq('verified', false)
        else query = query.eq('account_status', status)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }
    } else if (type === 'property_seeker') {
      if (status !== 'all') {
        query = query.eq('status', status)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Admin users list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function getTableName(type) {
  const map = {
    developer: 'developers',
    agent: 'agents',
    agency: 'agencies',
    property_seeker: 'property_seekers'
  }
  return map[type] || 'developers'
}
