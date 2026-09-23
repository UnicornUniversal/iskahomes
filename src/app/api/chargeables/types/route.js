import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { applyChargeableTypeToOwnerListings, INTERVAL_UNITS, mapChargeableType } from '@/lib/chargeables'
import { requireChargeableOwner } from '../_auth'

async function attachRevenue(types, owner) {
  if (!types.length) return types.map((row) => mapChargeableType(row))

  const { data: entries } = await supabaseAdmin
    .from('chargeable_entries')
    .select('chargeable_type, amount, status')
    .eq('user_id', owner.userId)
    .eq('user_type', owner.userType)

  const revenue = {}
  ;(entries || []).forEach((entry) => {
    const key = entry.chargeable_type
    if (!revenue[key]) revenue[key] = { total: 0, incoming: 0 }
    const amount = parseFloat(entry.amount) || 0
    if (String(entry.status || '').toLowerCase() === 'paid') revenue[key].total += amount
    else revenue[key].incoming += amount
  })

  return types.map((row) => mapChargeableType(row, revenue[row.id]))
}

export async function GET(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data, error } = await supabaseAdmin
      .from('chargeable_types')
      .select('*')
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('chargeable types list error:', error)
      return NextResponse.json({ error: 'Failed to load chargeables' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: await attachRevenue(data || [], auth.owner) })
  } catch (err) {
    console.error('chargeable types GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const intervalUnit = body.defaultIntervalUnit || 'month'
    if (!INTERVAL_UNITS.includes(intervalUnit)) {
      return NextResponse.json({ error: 'Invalid interval unit' }, { status: 400 })
    }

    const insert = {
      user_id: auth.owner.userId,
      user_type: auth.owner.userType,
      name,
      description: body.description || null,
      default_amount: Number(body.defaultAmount) || 0,
      default_interval_value: Math.max(1, Number(body.defaultIntervalValue) || 1),
      default_interval_unit: intervalUnit,
      is_default: !!body.isDefault
    }

    const { data, error } = await supabaseAdmin
      .from('chargeable_types')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('chargeable type create error:', error)
      return NextResponse.json({ error: 'Failed to create chargeable' }, { status: 500 })
    }

    let attachedCount = 0
    if (insert.is_default) {
      try {
        attachedCount = await applyChargeableTypeToOwnerListings(supabaseAdmin, auth.owner.userId, data.id)
      } catch (attachError) {
        console.error('chargeable type attach-default error:', attachError)
      }
    }

    return NextResponse.json({ success: true, data: mapChargeableType(data), attachedCount }, { status: 201 })
  } catch (err) {
    console.error('chargeable types POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
