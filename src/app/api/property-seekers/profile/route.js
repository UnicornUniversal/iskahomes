import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch property seeker profile
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'property_seeker') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    // Get property seeker profile
    const { data: seeker, error } = await supabaseAdmin
      .from('property_seekers')
      .select('*')
      .eq('id', decoded.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch property seeker profile', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: seeker
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update property seeker profile
export async function PUT(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.user_type !== 'property_seeker') {
      return NextResponse.json({ error: 'Invalid token or user type' }, { status: 401 })
    }

    const body = await request.json()
    
    // Parse JSON fields if they're strings
    const updateData = { ...body }
    
    // Handle JSON string fields
    if (updateData.preferred_property_types && typeof updateData.preferred_property_types === 'string') {
      try {
        updateData.preferred_property_types = JSON.parse(updateData.preferred_property_types)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }
    
    if (updateData.preferred_property_categories && typeof updateData.preferred_property_categories === 'string') {
      try {
        updateData.preferred_property_categories = JSON.parse(updateData.preferred_property_categories)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }
    
    if (updateData.preferred_property_purposes && typeof updateData.preferred_property_purposes === 'string') {
      try {
        updateData.preferred_property_purposes = JSON.parse(updateData.preferred_property_purposes)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }
    
    if (updateData.preferred_locations && typeof updateData.preferred_locations === 'string') {
      try {
        updateData.preferred_locations = JSON.parse(updateData.preferred_locations)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }
    
    if (updateData.current_location && typeof updateData.current_location === 'string') {
      try {
        updateData.current_location = JSON.parse(updateData.current_location)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }
    
    if (updateData.notification_preferences && typeof updateData.notification_preferences === 'string') {
      try {
        updateData.notification_preferences = JSON.parse(updateData.notification_preferences)
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Update property seeker profile
    const { data: updatedSeeker, error: updateError } = await supabaseAdmin
      .from('property_seekers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: updatedSeeker,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

