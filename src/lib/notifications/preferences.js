import { supabaseAdmin } from '@/lib/supabase'
import { NOTIFICATION_SETTING_KEYS } from './constants'

function resolveOwnerTable(userType) {
  if (userType === 'developer') {
    return {
      table: 'developers',
      idColumn: 'developer_id'
    }
  }

  if (userType === 'agency') {
    return {
      table: 'agencies',
      idColumn: 'agency_id'
    }
  }

  if (userType === 'agent') {
    return {
      table: 'agents',
      idColumn: 'agent_id'
    }
  }

  if (userType === 'property_seeker') {
    return {
      table: 'property_seekers',
      idColumn: 'user_id'
    }
  }

  return null
}

export async function getNotificationChannelsForType({
  userId,
  userType,
  notificationType
}) {
  const settingKey = NOTIFICATION_SETTING_KEYS[notificationType]
  if (!settingKey) {
    return { sms: false, email: false }
  }

  const target = resolveOwnerTable(userType)
  if (!target) {
    return { sms: false, email: false }
  }

  if (target.table === 'property_seekers') {
    const { data } = await supabaseAdmin
      .from('property_seekers')
      .select('notification_preferences')
      .eq(target.idColumn, userId)
      .maybeSingle()

    const preferences = data?.notification_preferences || {}
    return {
      sms: preferences.sms_notifications === true,
      email: preferences.email_notifications === true
    }
  }

  const { data } = await supabaseAdmin
    .from(target.table)
    .select('settings')
    .eq(target.idColumn, userId)
    .maybeSingle()

  const settings = data?.settings || {}
  const current = settings?.[settingKey]
  const legacy = settingKey === 'chargeables' ? settings?.service_charges : null
  const prefs = current && typeof current === 'object' ? current : legacy
  return {
    sms: prefs?.sms === true,
    email: prefs?.email === true
  }
}

export async function getUserContact({
  userId,
  userType
}) {
  const target = resolveOwnerTable(userType)
  if (!target) {
    return { email: null, phone: null, name: null }
  }

  const columns = target.table === 'property_seekers'
    ? 'full_name, email, phone'
    : 'name, email, phone'

  const { data } = await supabaseAdmin
    .from(target.table)
    .select(columns)
    .eq(target.idColumn, userId)
    .maybeSingle()

  if (!data) {
    return { email: null, phone: null, name: null }
  }

  return {
    email: data.email || null,
    phone: data.phone || null,
    name: data.name || data.full_name || null
  }
}

