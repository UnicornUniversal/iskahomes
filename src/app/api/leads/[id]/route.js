import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, notes } = body

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

    // Handle notes update
    if (notes !== undefined) {
      updateData.notes = Array.isArray(notes) ? notes : []
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

    // Return the updated record that was originally requested (by id)
    const updatedRecord = updatedLeads?.find(l => l.id === id) || updatedLeads?.[0]

    return NextResponse.json({
      success: true,
      data: updatedRecord,
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

