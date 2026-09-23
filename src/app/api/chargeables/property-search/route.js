import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { listingCover, listingLocation, parseChargeablesList } from '@/lib/chargeables'
import { requireChargeableOwner } from '../_auth'

export async function GET(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') || '').trim()
    const attachedOnly = searchParams.get('attachedOnly') === '1'
    const limit = Math.min(25, Math.max(1, Number(searchParams.get('limit') || 5)))
    const offset = Math.max(0, Number(searchParams.get('offset') || 0))

    let query = supabaseAdmin
      .from('listings')
      .select('id, title, chargeables, media, town, city, state, full_address')
      .eq('user_id', auth.owner.userId)
      .order('title', { ascending: true })
      .range(offset, offset + limit)

    if (q.length > 0) {
      query = query.ilike('title', `%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('property search error:', error)
      return NextResponse.json({ error: 'Failed to search properties' }, { status: 500 })
    }

    let rows = data || []
    const hasMore = rows.length > limit
    rows = rows.slice(0, limit)

    if (attachedOnly) {
      rows = rows.filter((l) => parseChargeablesList(l.chargeables).length > 0)
    }

    return NextResponse.json({
      success: true,
      data: rows.map((l) => ({
        id: l.id,
        name: l.title,
        cover: listingCover(l),
        location: listingLocation(l),
        chargeables: parseChargeablesList(l.chargeables)
      })),
      hasMore
    })
  } catch (err) {
    console.error('property search GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
