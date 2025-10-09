import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// GET - Fetch a specific development
export async function GET(request, { params }) {
  try {
    const { id } = params

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
    const { id } = params
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
    const { id } = params

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
