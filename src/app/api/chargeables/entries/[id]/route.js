import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addDays, mapChargeableEntry, normalizeServiceChargeTime } from '@/lib/chargeables'
import { NOTIFICATION_TYPES } from '@/lib/notifications/constants'
import { cancelNotificationByRecord, rescheduleNotificationFromRecord } from '@/lib/notifications/scheduler'
import { ensureNotificationQueueReady } from '@/lib/notifications/queue'
import { appendChargeableLifecycle } from '@/lib/notifications/records'
import { requireChargeableOwner } from '../../_auth'

const REDIS_UNAVAILABLE = 'Reminder service is unavailable. The change was not saved.'

async function restoreEntry(id, existing) {
  await supabaseAdmin
    .from('chargeable_entries')
    .update({
      amount: existing.amount,
      new_amount: existing.new_amount,
      period_start: existing.period_start,
      period_end: existing.period_end,
      next_due_date: existing.next_due_date,
      next_due_time: existing.next_due_time,
      status: existing.status,
      paid_at: existing.paid_at,
      billing_reference: existing.billing_reference,
      next_due_status: existing.next_due_status,
      notification_status: existing.notification_status,
      event_series: existing.event_series
    })
    .eq('id', id)
}

async function getOwnedEntry(id, owner) {
  const { data } = await supabaseAdmin
    .from('chargeable_entries')
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
    if (!id) return NextResponse.json({ error: 'Entry id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const existing = await getOwnedEntry(id, auth.owner)
    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

    const body = await request.json()
    const update = {}

    if (body.amount !== undefined) update.amount = Number(body.amount)
    if (body.newAmount !== undefined) update.new_amount = body.newAmount === '' || body.newAmount == null ? null : Number(body.newAmount)
    if (body.intervalValue !== undefined) update.interval_value = Number(body.intervalValue) || existing.interval_value
    if (body.intervalUnit !== undefined) update.interval_unit = body.intervalUnit
    if (body.newIntervalValue !== undefined) {
      update.new_interval_value = body.newIntervalValue === '' || body.newIntervalValue == null ? null : Number(body.newIntervalValue)
    }
    if (body.newIntervalUnit !== undefined) update.new_interval_unit = body.newIntervalUnit || null
    if (body.periodStart !== undefined) update.period_start = body.periodStart || null
    if (body.periodEnd !== undefined) {
      update.period_end = body.periodEnd || null
      update.next_due_date = body.periodEnd ? addDays(body.periodEnd, 1) : null
    }
    if (body.nextDueTime !== undefined) update.next_due_time = normalizeServiceChargeTime(body.nextDueTime) || existing.next_due_time
    if (body.status !== undefined) update.status = body.status
    if (body.paidAt !== undefined) update.paid_at = body.paidAt || null
    if (body.billingReference !== undefined) update.billing_reference = body.billingReference || null
    if (body.nextDueStatus !== undefined) update.next_due_status = body.nextDueStatus

    const { data, error } = await supabaseAdmin
      .from('chargeable_entries')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('chargeable entry update error:', error)
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    const becamePaid = String(data.next_due_status || '').toLowerCase() === 'paid'
      && String(existing.next_due_status || '').toLowerCase() !== 'paid'
    if (becamePaid) {
      try {
        await appendChargeableLifecycle(existing, {
          next_due_status: 'paid',
          status: data.status,
          paid_at: data.paid_at
        }, 'paid', { next_due_status: 'paid', paid_at: data.paid_at, status: data.status })
      } catch (logError) {
        console.error('Failed to log chargeable paid event:', logError)
      }
    }

    const scheduleChanged =
      Object.prototype.hasOwnProperty.call(update, 'next_due_date') ||
      Object.prototype.hasOwnProperty.call(update, 'next_due_time') ||
      Object.prototype.hasOwnProperty.call(update, 'next_due_status')

    if (scheduleChanged) {
      try {
        await ensureNotificationQueueReady()
        if (String(data.next_due_status || '').toLowerCase() === 'paid' || !data.next_due_date) {
          await cancelNotificationByRecord({
            notificationType: NOTIFICATION_TYPES.CHARGEABLE,
            recordId: id
          })
        } else {
          await rescheduleNotificationFromRecord({
            notificationType: NOTIFICATION_TYPES.CHARGEABLE,
            recordId: id,
            userId: data.created_by_user_id || auth.userInfo.user_id,
            userType: data.created_by_user_type || auth.userInfo.user_type || auth.owner.userType
          })
        }
      } catch (scheduleError) {
        console.error('Failed to reschedule chargeable notification:', scheduleError)
        await restoreEntry(id, existing)
        return NextResponse.json({ error: REDIS_UNAVAILABLE }, { status: 503 })
      }
    }

    return NextResponse.json({ success: true, data: mapChargeableEntry(data) })
  } catch (err) {
    console.error('chargeable entries PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const id = resolved?.id
    if (!id) return NextResponse.json({ error: 'Entry id required' }, { status: 400 })

    const auth = await requireChargeableOwner(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const existing = await getOwnedEntry(id, auth.owner)
    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

    try {
      await ensureNotificationQueueReady()
      await cancelNotificationByRecord({
        notificationType: NOTIFICATION_TYPES.CHARGEABLE,
        recordId: id
      })
    } catch (cancelError) {
      console.error('Failed to cancel chargeable notification:', cancelError)
      return NextResponse.json({ error: REDIS_UNAVAILABLE }, { status: 503 })
    }

    const { error } = await supabaseAdmin.from('chargeable_entries').delete().eq('id', id)
    if (error) {
      console.error('chargeable entry delete error:', error)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('chargeable entries DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
