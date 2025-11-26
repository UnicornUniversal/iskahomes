import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes, reminders } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // First, fetch the lead record to get seeker_id and listing_id
    const { data: leadRecord, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('seeker_id, listing_id, status, status_tracker')
      .eq('id', id)
      .single()

    if (fetchError || !leadRecord) {
      console.error('Error fetching lead:', fetchError)
      return NextResponse.json(
        { error: 'Lead not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    // Build update data
    const updateData = {}
    const now = new Date().toISOString()
    updateData.updated_at = now

    // Handle status update
    if (status !== undefined && status !== leadRecord.status) {
      updateData.status = status
      
      // Update status_tracker: append new status if it's different
      const currentTracker = Array.isArray(leadRecord.status_tracker) 
        ? leadRecord.status_tracker 
        : (leadRecord.status_tracker ? [leadRecord.status_tracker] : [])
      
      // Only add if it's a new status (not already in tracker)
      if (!currentTracker.includes(status)) {
        updateData.status_tracker = [...currentTracker, status]
      } else {
        updateData.status_tracker = currentTracker
      }
    } else if (status !== undefined) {
      // Status is the same, just ensure status_tracker exists
      const currentTracker = Array.isArray(leadRecord.status_tracker) 
        ? leadRecord.status_tracker 
        : (leadRecord.status_tracker ? [leadRecord.status_tracker] : [])
      if (currentTracker.length === 0 && leadRecord.status) {
        // Initialize tracker with current status if empty
        updateData.status_tracker = [leadRecord.status]
      }
    }

    // Handle notes update - always update if provided
    if (notes !== undefined) {
      // Ensure notes is an array
      if (Array.isArray(notes)) {
        updateData.notes = notes
      } else if (typeof notes === 'string') {
        // If it's a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(notes)
          updateData.notes = Array.isArray(parsed) ? parsed : []
        } catch (e) {
          updateData.notes = []
        }
      } else {
        updateData.notes = []
      }
    }

    // Update ALL records in the same group (same seeker_id + listing_id)
    // This ensures consistency across all records for the same lead
    const { data: updatedLeads, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('seeker_id', leadRecord.seeker_id)
      .eq('listing_id', leadRecord.listing_id)
      .select()

    if (updateError) {
      console.error('Error updating leads:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead', details: updateError.message },
        { status: 500 }
      )
    }

    // Handle reminders updates (create, update, delete) - unified save
    const groupedLeadKey = `${leadRecord.seeker_id}_${leadRecord.listing_id || 'null'}`
    let remindersResult = { created: [], updated: [], deleted: [] }

    if (reminders !== undefined && Array.isArray(reminders)) {
      // Get current reminders for this grouped lead
      const { data: currentReminders, error: fetchRemindersError } = await supabaseAdmin
        .from('reminders')
        .select('*')
        .eq('grouped_lead_key', groupedLeadKey)

      if (!fetchRemindersError && currentReminders) {
        const currentReminderIds = new Set(currentReminders.map(r => r.id))
        const newReminderIds = new Set(reminders.filter(r => r.id).map(r => r.id))

        // Delete reminders that are no longer in the list
        const toDelete = currentReminders.filter(r => !newReminderIds.has(r.id))
        for (const reminder of toDelete) {
          const { error: deleteError } = await supabaseAdmin
            .from('reminders')
            .delete()
            .eq('id', reminder.id)
          if (!deleteError) {
            remindersResult.deleted.push(reminder.id)
          }
        }

        // Create new reminders and update existing ones
        for (const reminder of reminders) {
          if (reminder.id && currentReminderIds.has(reminder.id)) {
            // Update existing reminder
            // Include user_id and user_type if provided
            const { id, ...updateFields } = reminder
            const { user_id, user_type } = body
            const updateData = {
              ...updateFields,
              ...(user_id && { user_id }),
              ...(user_type && { user_type })
            }
            const { data: updated, error: updateReminderError } = await supabaseAdmin
              .from('reminders')
              .update(updateData)
              .eq('id', id)
              .select()
              .single()
            if (!updateReminderError && updated) {
              remindersResult.updated.push(updated)
            }
          } else if (!reminder.id) {
            // Create new reminder (only if it doesn't have an id)
            // Include user_id and user_type if provided in the request body
            const { user_id, user_type } = body
            const { data: created, error: createReminderError } = await supabaseAdmin
              .from('reminders')
              .insert({
                lead_id: id,
                grouped_lead_key: groupedLeadKey,
                note_text: reminder.note_text,
                reminder_date: reminder.reminder_date,
                reminder_time: reminder.reminder_time || null,
                priority: reminder.priority || 'normal',
                status: reminder.status || 'incomplete',
                user_id: user_id || null,
                user_type: user_type || null
              })
              .select()
              .single()
            if (!createReminderError && created) {
              remindersResult.created.push(created)
            }
          }
        }
      }
    }

    // Return the updated record that was originally requested (by id)
    const updatedRecord = updatedLeads?.find(l => l.id === id) || updatedLeads?.[0]

    // Ensure notes is properly formatted as JSONB array
    if (updatedRecord && updatedRecord.notes) {
      // If notes is a string, parse it; otherwise use as-is
      if (typeof updatedRecord.notes === 'string') {
        try {
          updatedRecord.notes = JSON.parse(updatedRecord.notes)
        } catch (e) {
          updatedRecord.notes = []
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      reminders: remindersResult,
      message: `Updated ${updatedLeads?.length || 0} lead record(s) in the group`
    })

  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

