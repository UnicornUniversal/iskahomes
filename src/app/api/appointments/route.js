import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'
import { captureAuditEvent } from '@/lib/auditLogger'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      account_type, 
      account_id, 
      listing_id, 
      seeker_id,
      appointment_date, 
      appointment_time, 
      duration = 60,
      appointment_type = 'in-person',
      meeting_location,
      client_name,
      client_email,
      client_phone,
      notes 
    } = body

    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token
    const decoded = verifyToken(token)
    console.log('🔍 Appointment - Decoded token:', decoded)
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify that the seeker_id matches the token
    if (seeker_id !== decoded.id) {
      return NextResponse.json(
        { error: 'Unauthorized: seeker_id does not match token' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!account_type || !account_id || !listing_id || !seeker_id || !appointment_date || !appointment_time || !client_name || !client_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate account_type
    if (!['agent', 'developer', 'agency'].includes(account_type)) {
      return NextResponse.json(
        { error: 'Invalid account_type. Must be "agent", "developer", or "agency"' },
        { status: 400 }
      )
    }

    // Validate appointment_type
    if (!['in-person', 'virtual', 'phone'].includes(appointment_type)) {
      return NextResponse.json(
        { error: 'Invalid appointment_type. Must be "in-person", "virtual", or "phone"' },
        { status: 400 }
      )
    }

    console.log('Creating appointment:', { account_type, account_id, listing_id, seeker_id, client_name })

    // Insert appointment into database
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        account_type,
        account_id,
        listing_id,
        seeker_id,
        appointment_date,
        appointment_time,
        duration,
        appointment_type,
        meeting_location,
        client_name,
        client_email,
        client_phone,
        notes,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment', details: error.message },
        { status: 500 }
      )
    }

    // Update total_appointments count for property seeker - increment by 1
    const { data: currentSeeker, error: fetchError } = await supabase
      .from('property_seekers')
      .select('total_appointments')
      .eq('id', seeker_id)
      .single()

    if (!fetchError && currentSeeker) {
      const { error: updateError } = await supabase
        .from('property_seekers')
        .update({ 
          total_appointments: (currentSeeker.total_appointments || 0) + 1
        })
        .eq('id', seeker_id)

      if (updateError) {
        console.error('Error updating appointments count:', updateError)
        // Don't fail the request, just log the error
      }
    }

    // Update total_appointments in listings table - increment by 1
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, account_type, total_appointments')
      .eq('id', listing_id)
      .single()

    if (!listingError && listing) {
      const newAppointmentsCount = (listing.total_appointments || 0) + 1
      const { error: updateListingError } = await supabase
        .from('listings')
        .update({ 
          total_appointments: newAppointmentsCount
        })
        .eq('id', listing_id)

      if (updateListingError) {
        console.error('Error updating listing appointments count:', updateListingError)
      }
    }

    // Update total_appointments for developer/agent/agency using request account_type and account_id
    const tableName = account_type === 'developer' ? 'developers' : account_type === 'agency' ? 'agencies' : 'agents'
    const idField = account_type === 'developer' ? 'developer_id' : account_type === 'agency' ? 'agency_id' : 'agent_id'

    const { data: listerRow, error: listerFetchError } = await supabase
      .from(tableName)
      .select(`${idField}, total_appointments${account_type === 'agent' ? ', agency_id' : ''}`)
      .eq(idField, account_id)
      .single()

    if (!listerFetchError && listerRow) {
      const newCount = (listerRow.total_appointments || 0) + 1
      const { error: updateListerError } = await supabase
        .from(tableName)
        .update({ total_appointments: newCount })
        .eq(idField, account_id)

      if (updateListerError) {
        console.error(`Error updating ${tableName} appointments count:`, updateListerError)
      }

      // When agent has agency_id: also increment agency's agents_total_appointments
      if (account_type === 'agent' && listerRow.agency_id) {
        const { data: agencyRow, error: agencyFetchErr } = await supabase
          .from('agencies')
          .select('agents_total_appointments')
          .eq('agency_id', listerRow.agency_id)
          .single()
        if (!agencyFetchErr && agencyRow) {
          await supabase
            .from('agencies')
            .update({ agents_total_appointments: (agencyRow.agents_total_appointments || 0) + 1 })
            .eq('agency_id', listerRow.agency_id)
        }
      }

      // When agency direct: increment agency_appointments
      if (account_type === 'agency') {
        const { data: agencyRow, error: agencyFetchErr } = await supabase
          .from('agencies')
          .select('agency_appointments')
          .eq('agency_id', account_id)
          .single()
        if (!agencyFetchErr && agencyRow) {
          await supabase
            .from('agencies')
            .update({ agency_appointments: (agencyRow.agency_appointments || 0) + 1 })
            .eq('agency_id', account_id)
        }
      }
    }

    console.log('Appointment created successfully:', appointment.id)

    captureAuditEvent('appointment_created', {
      user_id: decoded.id,
      user_type: decoded.user_type || 'property_seeker',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/appointments',
      metadata: {
        appointment_id: appointment.id,
        listing_id,
        account_type
      }
    }, decoded.id)

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment scheduled successfully!'
    })

  } catch (error) {
    console.error('Appointment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const account_type = searchParams.get('account_type')
    const account_id = searchParams.get('account_id')
    const listing_id = searchParams.get('listing_id')
    const status = searchParams.get('status')
    const seeker_id = searchParams.get('seeker_id')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    // Check for authorization header for property seeker requests
    const authHeader = request.headers.get('authorization')
    let decoded = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      decoded = verifyToken(token)
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        listings (
          id,
          title,
          description,
          price,
          currency,
          price_type,
          duration,
          size,
          status,
          country,
          state,
          city,
          town,
          full_address,
          latitude,
          longitude,
          specifications,
          amenities,
          media,
          available_from,
          available_until,
          is_featured,
          is_verified,
          is_premium,
          cancellation_policy,
          is_negotiable,
          security_requirements,
          flexible_terms,
          acquisition_rules,
          additional_information,
          slug,
          created_at,
          updated_at
        )
      `)
      .order('appointment_date', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (account_type) {
      query = query.eq('account_type', account_type)
    }
    if (account_id) {
      query = query.eq('account_id', account_id)
    }
    if (listing_id) {
      query = query.eq('listing_id', listing_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (seeker_id) {
      query = query.eq('seeker_id', seeker_id)
    }

    // If no specific filters and user is authenticated, show their appointments
    if (!account_type && !account_id && !listing_id && !seeker_id && decoded) {
      query = query.eq('seeker_id', decoded.id)
    }

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      )
    }

    const auditUserId = decoded?.id || seeker_id || account_id || 'unknown'
    captureAuditEvent('appointment_listed', {
      user_id: auditUserId,
      user_type: decoded?.user_type || account_type || 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/appointments',
      metadata: {
        account_type,
        account_id,
        listing_id,
        status,
        page,
        limit,
        result_count: appointments?.length || 0
      }
    }, auditUserId)

    return NextResponse.json({
      success: true,
      data: appointments || [],
      total: count || appointments?.length || 0,
      page,
      limit,
      hasMore: appointments?.length === limit
    })

  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, status, appointment_date, appointment_time, notes, meeting_location, appointment_type, duration, response_notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const updateData = {}
    if (status) updateData.status = status
    if (appointment_date) updateData.appointment_date = appointment_date
    if (appointment_time) updateData.appointment_time = appointment_time
    if (notes !== undefined) updateData.notes = notes
    if (meeting_location !== undefined) updateData.meeting_location = meeting_location
    if (appointment_type !== undefined) updateData.appointment_type = appointment_type
    if (duration !== undefined) updateData.duration = duration
    if (response_notes !== undefined) updateData.response_notes = response_notes

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        listings (
          id,
          title,
          slug,
          listing_type,
          city,
          state,
          country
        )
      `)
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json(
        { error: 'Failed to update appointment', details: error.message },
        { status: 500 }
      )
    }

    captureAuditEvent('appointment_updated', {
      user_id: appointment?.seeker_id || appointment?.account_id || 'unknown',
      user_type: 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
      api_route: '/api/appointments',
      metadata: {
        appointment_id: id,
        status: updateData.status || null
      }
    }, appointment?.seeker_id || appointment?.account_id || 'unknown')

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully!'
    })

  } catch (error) {
    console.error('Appointment update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
