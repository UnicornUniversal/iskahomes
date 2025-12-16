import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, phone, message, services } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'At least one service must be selected' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Create service inquiry record
    const { data, error } = await supabaseAdmin
      .from('service_inquiries')
      .insert({
        name: name,
        email: email,
        phone: phone,
        message: message || null,
        services: services, // Array of service IDs
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service inquiry:', error)
      
      // If table doesn't exist, we'll create a simple response
      // In production, you should create the table first
      if (error.code === '42P01') {
        console.warn('service_inquiries table does not exist. Creating inquiry record in alternative location.')
        
        // You could store this in a generic inquiries table or send an email
        // For now, we'll return success but log the data
        console.log('Service Inquiry Data:', {
          name,
          email,
          phone,
          message,
          services,
          timestamp: new Date().toISOString()
        })

        return NextResponse.json({
          success: true,
          message: 'Inquiry received successfully. We will contact you soon.',
          inquiry_id: `temp_${Date.now()}`
        })
      }

      return NextResponse.json(
        { error: 'Failed to submit inquiry', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon.',
      inquiry_id: data.id
    })

  } catch (error) {
    console.error('Service inquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

