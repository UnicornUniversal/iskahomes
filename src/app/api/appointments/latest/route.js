import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Fetch latest appointments for the account
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        client_name,
        client_email,
        client_phone,
        appointment_date,
        appointment_time,
        status,
        meeting_location,
        appointment_type,
        created_at,
        listings:listing_id (
          id,
          title,
          slug,
          listing_type,
          city,
          state,
          country
        )
      `)
      .eq('account_id', accountId)
      .eq('account_type', 'developer') // Assuming this is for developers
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedAppointments = appointments?.map(appointment => ({
      id: appointment.id,
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      clientPhone: appointment.client_phone,
      date: appointment.appointment_date,
      startTime: appointment.appointment_time,
      status: appointment.status,
      meetingLocation: appointment.meeting_location,
      appointmentType: appointment.appointment_type,
      createdAt: appointment.created_at,
      property: {
        id: appointment.listings?.id,
        title: appointment.listings?.title || 'Unknown Property',
        slug: appointment.listings?.slug,
        type: appointment.listings?.listing_type,
        location: {
          city: appointment.listings?.city,
          state: appointment.listings?.state,
          country: appointment.listings?.country
        }
      }
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedAppointments,
      total: transformedAppointments.length
    })

  } catch (error) {
    console.error('Latest appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
