import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// Helper function to update developer's total_developments count
async function updateDeveloperTotalDevelopments(developerIdFromRequest) {
  try {
    // Get developer record by developer_id (which matches the developer_id in developments table)
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id')
      .eq('developer_id', developerIdFromRequest)
      .single()

    if (devError || !developer) {
      console.error('Error fetching developer for total_developments update:', devError)
      return
    }

    // Count developments where developer_id matches the developer_id from request
    // Note: developments.developer_id stores developers.developer_id (not developers.id)
    const { count: totalDevelopmentsCount, error: countError } = await supabaseAdmin
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerIdFromRequest)

    if (countError) {
      console.error('Error counting developments:', countError)
      return
    }

    // Update developer's total_developments
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({ total_developments: totalDevelopmentsCount || 0 })
      .eq('id', developer.id)

    if (updateError) {
      console.error('Error updating developer total_developments:', updateError)
    } else {
      console.log('✅ Developer total_developments updated:', {
        developer_id: developerIdFromRequest,
        total_developments: totalDevelopmentsCount || 0
      })
    }
  } catch (error) {
    console.error('Error in updateDeveloperTotalDevelopments:', error)
  }
}

// GET - Fetch a specific development
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Fetch the development
    const { data: development, error } = await supabase
      .from('developments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching development:', error)
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    // Check if the developer owns this development
    if (development.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: development })

  } catch (error) {
    console.error('Get development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a development
export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const body = await request.json()

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // First check if the development exists and belongs to the developer
    const { data: existingDevelopment, error: fetchError } = await supabase
      .from('developments')
      .select('developer_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (existingDevelopment.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    // Update the development
    const { data: development, error } = await supabase
      .from('developments')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating development:', error)
      return NextResponse.json(
        { error: 'Failed to update development' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: development,
      message: 'Development updated successfully' 
    })

  } catch (error) {
    console.error('Update development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a development
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // First check if the development exists and belongs to the developer
    const { data: existingDevelopment, error: fetchError } = await supabase
      .from('developments')
      .select('developer_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (existingDevelopment.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    // Store developer_id before deletion for updating total_developments
    const developerIdToUpdate = existingDevelopment.developer_id

    // Delete the development
    const { error } = await supabase
      .from('developments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting development:', error)
      return NextResponse.json(
        { error: 'Failed to delete development' },
        { status: 500 }
      )
    }

    // Update developer's total_developments count
    await updateDeveloperTotalDevelopments(developerIdToUpdate)

    return NextResponse.json({ 
      success: true,
      message: 'Development deleted successfully' 
    })

  } catch (error) {
    console.error('Delete development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
