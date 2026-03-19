import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { captureAuditEvent } from '@/lib/auditLogger'
import { NOTIFICATION_TYPES } from '@/lib/notifications/constants'
import { cancelNotificationByRecord, rescheduleNotificationFromRecord } from '@/lib/notifications/scheduler'
import { startNotificationWorker } from '@/lib/notifications/worker'

// PATCH /api/reminders/[id] - Update reminder status or details
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, priority, note_text, reminder_date, reminder_time } = body

    const { data: existingReminder, error: existingReminderError } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (existingReminderError) {
      return NextResponse.json(
        { error: 'Failed to fetch existing reminder', details: existingReminderError.message },
        { status: 500 }
      )
    }

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData = {}
    if (status !== undefined) {
      if (!['incomplete', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be incomplete, completed, or cancelled' },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    if (priority !== undefined) {
      if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be low, normal, high, or urgent' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }
    if (note_text !== undefined) updateData.note_text = note_text
    if (reminder_date !== undefined) updateData.reminder_date = reminder_date
    if (reminder_time !== undefined) updateData.reminder_time = reminder_time

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const nextStatus = status !== undefined ? status : existingReminder.status
    const nextReminderDate = reminder_date !== undefined ? reminder_date : existingReminder.reminder_date
    const nextReminderTime = reminder_time !== undefined ? reminder_time : existingReminder.reminder_time

    if (nextStatus === 'incomplete' && (!nextReminderDate || !nextReminderTime)) {
      return NextResponse.json(
        { error: 'Incomplete reminders must have both reminder_date and reminder_time' },
        { status: 400 }
      )
    }

    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      return NextResponse.json(
        { error: 'Failed to update reminder', details: error.message },
        { status: 500 }
      )
    }

    captureAuditEvent('reminder_updated', {
      user_id: reminder.user_id || 'unknown',
      user_type: reminder.user_type || 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/reminders/[id]',
      metadata: {
        reminder_id: id,
        updated_fields: Object.keys(updateData)
      }
    }, reminder.user_id || 'unknown')

    const shouldCancel = reminder.status === 'completed' || reminder.status === 'cancelled'
    const shouldReschedule = !shouldCancel && (
      Object.prototype.hasOwnProperty.call(updateData, 'reminder_date') ||
      Object.prototype.hasOwnProperty.call(updateData, 'reminder_time') ||
      Object.prototype.hasOwnProperty.call(updateData, 'status')
    )

    try {
      if (shouldCancel) {
        await cancelNotificationByRecord({
          notificationType: NOTIFICATION_TYPES.REMINDER,
          recordId: id
        })
      } else if (shouldReschedule && reminder.user_id && reminder.user_type) {
        startNotificationWorker()
        await rescheduleNotificationFromRecord({
          notificationType: NOTIFICATION_TYPES.REMINDER,
          recordId: id,
          userId: reminder.user_id,
          userType: reminder.user_type
        })
      }
    } catch (scheduleError) {
      console.error('Reminder notification scheduling sync failed:', scheduleError)
    }

    return NextResponse.json({
      success: true,
      data: reminder
    })
  } catch (error) {
    console.error('Error in PATCH /api/reminders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { data: existingReminder } = await supabaseAdmin
      .from('reminders')
      .select('id, user_id, user_type')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabaseAdmin
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reminder:', error)
      return NextResponse.json(
        { error: 'Failed to delete reminder', details: error.message },
        { status: 500 }
      )
    }

    captureAuditEvent('reminder_deleted', {
      user_id: existingReminder?.user_id || 'unknown',
      user_type: existingReminder?.user_type || 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/reminders/[id]',
      metadata: {
        reminder_id: id
      }
    }, existingReminder?.user_id || 'unknown')

    try {
      await cancelNotificationByRecord({
        notificationType: NOTIFICATION_TYPES.REMINDER,
        recordId: id
      })
    } catch (scheduleError) {
      console.error('Failed to cancel deleted reminder notification:', scheduleError)
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/reminders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

