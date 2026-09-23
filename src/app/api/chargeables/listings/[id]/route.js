import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseChargeablesList } from '@/lib/chargeables'
import { requireChargeableOwner } from '../../_auth'

export async function GET(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Listing id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, chargeables')
      .eq('id', id)
      .eq('user_id', auth.owner.userId)
      .maybeSingle()

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: parseChargeablesList(listing.chargeables)
    })
  } catch (err) {
    console.error('listing chargeables GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Listing id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, chargeables')
      .eq('id', id)
      .eq('user_id', auth.owner.userId)
      .maybeSingle()

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const body = await request.json()
    const chargeables = parseChargeablesList(body.chargeables)

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ chargeables })
      .eq('id', id)
      .select('id, chargeables')
      .single()

    if (error) {
      console.error('listing chargeables update error:', error)
      return NextResponse.json({ error: 'Failed to update chargeables' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: parseChargeablesList(data.chargeables) })
  } catch (err) {
    console.error('listing chargeables PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
