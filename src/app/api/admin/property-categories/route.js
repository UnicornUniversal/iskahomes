import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all property categories
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('property_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new property category
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, property_type, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!property_type || (Array.isArray(property_type) && property_type.length === 0)) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    // Handle both single property_type and array of property_types
    const propertyTypes = Array.isArray(property_type) ? property_type : [property_type]
    
    // Since property_type is a text array in the database, we insert the entire array
    const { data, error } = await supabaseAdmin
      .from('property_categories')
      .insert({
        name,
        description,
        property_type: propertyTypes, // Insert as array directly
        active: active !== undefined ? active : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data, 
      message: `Property category created successfully${propertyTypes.length > 1 ? ` for ${propertyTypes.length} property types` : ''}` 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update property category
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, property_type, active } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    if (!property_type || (Array.isArray(property_type) && property_type.length === 0)) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    // Handle both single property_type and array of property_types
    const propertyTypes = Array.isArray(property_type) ? property_type : [property_type]
    
    // Update the existing record with the entire array
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('property_categories')
      .update({
        name,
        description,
        property_type: propertyTypes, // Update with the entire array
        active: active !== undefined ? active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data: updatedData, 
      message: `Property category updated successfully${propertyTypes.length > 1 ? ` for ${propertyTypes.length} property types` : ''}` 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete property category
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('property_categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Property category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
