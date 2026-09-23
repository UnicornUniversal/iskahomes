import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { INTERVAL_UNITS, mapChargeableType, removeChargeableId } from '@/lib/chargeables'
import { requireChargeableOwner } from '../../_auth'

async function getOwnedType(id, owner) {
  const { data } = await supabaseAdmin
    .from('chargeable_types')
    .select('*')
    .eq('id', id)
    .eq('user_id', owner.userId)
    .eq('user_type', owner.userType)
    .maybeSingle()
  return data
}

export async function PUT(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Type id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const existing = await getOwnedType(id, auth.owner)
    if (!existing) return NextResponse.json({ error: 'Chargeable not found' }, { status: 404 })

    const body = await request.json()
    const update = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) {
      const name = String(body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      update.name = name
    }
    if (body.description !== undefined) update.description = body.description || null
    if (body.defaultAmount !== undefined) update.default_amount = Number(body.defaultAmount) || 0
    if (body.defaultIntervalValue !== undefined) {
      update.default_interval_value = Math.max(1, Number(body.defaultIntervalValue) || 1)
    }
    if (body.defaultIntervalUnit !== undefined) {
      if (!INTERVAL_UNITS.includes(body.defaultIntervalUnit)) {
        return NextResponse.json({ error: 'Invalid interval unit' }, { status: 400 })
      }
      update.default_interval_unit = body.defaultIntervalUnit
    }
    if (body.isDefault !== undefined) update.is_default = !!body.isDefault

    const { data, error } = await supabaseAdmin
      .from('chargeable_types')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('chargeable type update error:', error)
      return NextResponse.json({ error: 'Failed to update chargeable' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: mapChargeableType(data) })
  } catch (err) {
    console.error('chargeable types PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Type id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const existing = await getOwnedType(id, auth.owner)
    if (!existing) return NextResponse.json({ error: 'Chargeable not found' }, { status: 404 })

    const { count } = await supabaseAdmin
      .from('chargeable_entries')
      .select('id', { count: 'exact', head: true })
      .eq('chargeable_type', id)

    if (count > 0) {
      return NextResponse.json(
        { error: 'This chargeable has entries. Delete those entries first.' },
        { status: 409 }
      )
    }

    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('id, chargeables')
      .eq('user_id', auth.owner.userId)

    for (const listing of listings || []) {
      const next = removeChargeableId(listing.chargeables, id)
      if (JSON.stringify(next) !== JSON.stringify(listing.chargeables || [])) {
        await supabaseAdmin.from('listings').update({ chargeables: next }).eq('id', listing.id)
      }
    }

    const { error } = await supabaseAdmin.from('chargeable_types').delete().eq('id', id)
    if (error) {
      console.error('chargeable type delete error:', error)
      return NextResponse.json({ error: 'Failed to delete chargeable' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('chargeable types DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
