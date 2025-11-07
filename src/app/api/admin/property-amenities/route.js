import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cacheAmenities, getCachedAmenities } from '@/lib/cache'

// GET - Fetch all property amenities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reconcile = searchParams.get('reconcile') === 'true'

    // If reconcile is requested, fetch from DB and update Redis
    if (reconcile) {
      const { data, error } = await supabaseAdmin
        .from('property_amenities')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Clean up property_type data for each amenity
      const cleanedData = data.map(amenity => ({
        ...amenity,
        property_type: cleanPropertyTypes(amenity.property_type)
      }))

      // Update Redis cache
      try {
        await cacheAmenities(cleanedData)
      } catch (redisError) {
        console.error('Redis cache update error:', redisError)
        // Continue even if Redis fails
      }

      return NextResponse.json({ 
        data: cleanedData,
        message: 'Data reconciled and cached successfully'
      })
    }

    // Try to get from Redis first
    try {
      const cachedData = await getCachedAmenities()
      if (cachedData) {
        return NextResponse.json({ data: cachedData, cached: true })
      }
    } catch (redisError) {
      console.error('Redis fetch error:', redisError)
      // Fall through to database fetch
    }

    // Fallback to database if cache miss
    const { data, error } = await supabaseAdmin
      .from('property_amenities')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clean up property_type data for each amenity
    const cleanedData = data.map(amenity => ({
      ...amenity,
      property_type: cleanPropertyTypes(amenity.property_type)
    }))

    // Cache the data for future requests
    try {
      await cacheAmenities(cleanedData)
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data: cleanedData, cached: false })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to clean property_type data
function cleanPropertyTypes(propertyType) {
  if (Array.isArray(propertyType)) {
    return propertyType.filter(type => type && type.trim() !== '')
  } else if (typeof propertyType === 'string') {
    try {
      const parsed = JSON.parse(propertyType)
      return Array.isArray(parsed) ? parsed.filter(type => type && type.trim() !== '') : [propertyType]
    } catch {
      return [propertyType]
    }
  } else {
    return [propertyType]
  }
}

// POST - Create new property amenity
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, property_type, icon, active } = body

    console.log('POST request body:', { name, description, property_type, icon, active })

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!property_type || (Array.isArray(property_type) && property_type.length === 0)) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    // Clean and validate property_type array
    const propertyTypes = cleanPropertyTypes(property_type)

    if (propertyTypes.length === 0) {
      return NextResponse.json({ error: 'At least one valid property type is required' }, { status: 400 })
    }

    console.log('Cleaned property types:', propertyTypes)
    
    // Since property_type is a text array in the database, we insert the entire array
    const { data, error } = await supabaseAdmin
      .from('property_amenities')
      .insert({
        name,
        description,
        property_type: propertyTypes, // Insert as array directly
        icon,
        active: active !== undefined ? active : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully created amenity:', data)

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_amenities')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        const cleanedData = allData.map(amenity => ({
          ...amenity,
          property_type: cleanPropertyTypes(amenity.property_type)
        }))
        await cacheAmenities(cleanedData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ 
      data, 
      message: `Property amenity created successfully${propertyTypes.length > 1 ? ` for ${propertyTypes.length} property types` : ''}` 
    })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update property amenity
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, property_type, icon, active } = body

    console.log('PUT request body:', { id, name, description, property_type, icon, active })

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    if (!property_type || (Array.isArray(property_type) && property_type.length === 0)) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    // Clean and validate property_type array
    const propertyTypes = cleanPropertyTypes(property_type)

    if (propertyTypes.length === 0) {
      return NextResponse.json({ error: 'At least one valid property type is required' }, { status: 400 })
    }

    console.log('Cleaned property types for update:', propertyTypes)
    
    // Update the existing record with the entire array
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('property_amenities')
      .update({
        name,
        description,
        property_type: propertyTypes, // Update with the entire array
        icon,
        active: active !== undefined ? active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating record:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('Successfully updated amenity:', updatedData)

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_amenities')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        const cleanedData = allData.map(amenity => ({
          ...amenity,
          property_type: cleanPropertyTypes(amenity.property_type)
        }))
        await cacheAmenities(cleanedData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ 
      data: updatedData, 
      message: `Property amenity updated successfully${propertyTypes.length > 1 ? ` for ${propertyTypes.length} property types` : ''}` 
    })
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete property amenity
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('property_amenities')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_amenities')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        const cleanedData = allData.map(amenity => ({
          ...amenity,
          property_type: cleanPropertyTypes(amenity.property_type)
        }))
        await cacheAmenities(cleanedData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ message: 'Property amenity deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
