import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'

const SETTINGS_TEMPLATE = {
  two_factor: { sms: false },
  reminders: { sms: false, email: false },
  appointments: { sms: false, email: false },
  service_charges: { sms: false, email: false },
  engagements: { sms: false, email: false }
}

function normalizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {}
  const normalized = {}

  for (const feature of Object.keys(SETTINGS_TEMPLATE)) {
    normalized[feature] = {}
    for (const channel of Object.keys(SETTINGS_TEMPLATE[feature])) {
      normalized[feature][channel] = source?.[feature]?.[channel] === true
    }
  }

  return normalized
}

function resolveProfileTarget(userInfo) {
  const orgType = userInfo.organization_type || userInfo.user_type

  if (orgType === 'developer') {
    return {
      table: 'developers',
      idColumn: 'id',
      idValue: userInfo.organization_id
    }
  }

  if (orgType === 'agency') {
    return {
      table: 'agencies',
      idColumn: 'id',
      idValue: userInfo.organization_id
    }
  }

  if (orgType === 'agent' || userInfo.user_type === 'agent') {
    return {
      table: 'agents',
      idColumn: 'agent_id',
      idValue: userInfo.agent_id || userInfo.user_id
    }
  }

  return null
}

export async function GET(request) {
  try {
    const { userInfo, error, status } = await authenticateRequest(request)
    if (error) {
      return NextResponse.json({ error }, { status: status || 401 })
    }

    const target = resolveProfileTarget(userInfo)
    if (!target?.idValue) {
      return NextResponse.json({ error: 'Unsupported user type for settings' }, { status: 403 })
    }

    const { data, error: dbError } = await supabaseAdmin
      .from(target.table)
      .select('settings')
      .eq(target.idColumn, target.idValue)
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      settings: normalizeSettings(data?.settings)
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { userInfo, error, status } = await authenticateRequest(request)
    if (error) {
      return NextResponse.json({ error }, { status: status || 401 })
    }

    const target = resolveProfileTarget(userInfo)
    if (!target?.idValue) {
      return NextResponse.json({ error: 'Unsupported user type for settings' }, { status: 403 })
    }

    const body = await request.json()
    const incoming = body?.settings ?? body
    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ error: 'settings object is required' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from(target.table)
      .select('settings')
      .eq(target.idColumn, target.idValue)
      .single()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    const merged = normalizeSettings(existing?.settings)
    for (const feature of Object.keys(SETTINGS_TEMPLATE)) {
      const incomingFeature = incoming?.[feature]
      if (!incomingFeature || typeof incomingFeature !== 'object') continue
      for (const channel of Object.keys(SETTINGS_TEMPLATE[feature])) {
        if (Object.prototype.hasOwnProperty.call(incomingFeature, channel)) {
          merged[feature][channel] = incomingFeature[channel] === true
        }
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(target.table)
      .update({ settings: merged })
      .eq(target.idColumn, target.idValue)
      .select('settings')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      settings: normalizeSettings(updated?.settings)
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

