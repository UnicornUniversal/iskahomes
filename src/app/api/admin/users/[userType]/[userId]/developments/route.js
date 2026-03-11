import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/users/developer/[userId]/developments
 * Developer developments only
 */
export async function GET(request, { params }) {
  try {
    const { userType, userId } = await params

    if (userType !== 'developer') {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('developments')
      .select('id, slug, title, description, city, state, country, development_status, total_units, number_of_buildings, purposes, types, created_at')
      .eq('developer_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Admin developer developments error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
