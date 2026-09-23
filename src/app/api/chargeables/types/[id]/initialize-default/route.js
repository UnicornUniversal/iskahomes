import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { applyChargeableTypeToOwnerListings, mapChargeableType } from '@/lib/chargeables'
import { requireChargeableOwner } from '../../../_auth'

export async function POST(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Type id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: type, error: typeError } = await supabaseAdmin
      .from('chargeable_types')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.owner.userId)
      .eq('user_type', auth.owner.userType)
      .maybeSingle()

    if (typeError || !type) {
      return NextResponse.json({ error: 'Chargeable not found' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('chargeable_types')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('initialize default type error:', updateError)
      return NextResponse.json({ error: 'Failed to set default' }, { status: 500 })
    }

    let attached = 0
    try {
      attached = await applyChargeableTypeToOwnerListings(supabaseAdmin, auth.owner.userId, id)
    } catch (listError) {
      console.error('initialize default listings error:', listError)
      return NextResponse.json({ error: 'Failed to attach to listings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: mapChargeableType(updated),
      attachedCount: attached
    })
  } catch (err) {
    console.error('initialize default error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
