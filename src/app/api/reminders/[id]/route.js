import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/reminders/[id] - Update reminder status or details
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, priority, note_text, reminder_date, reminder_time } = body

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

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
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

