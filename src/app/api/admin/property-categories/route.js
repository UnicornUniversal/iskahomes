import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'
import { invalidatePropertyCategoriesCache } from '@/lib/cacheInvalidation'
import { cachePropertyCategories, getCachedPropertyCategories } from '@/lib/cache'

// Cached function to fetch property categories from database
const getCachedPropertyCategoriesFromDB = cache(async () => {
  const { data, error } = await supabaseAdmin
    .from('property_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
})

// GET - Fetch all property categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reconcile = searchParams.get('reconcile') === 'true'

    // If reconcile is requested, fetch from DB and update Redis
    if (reconcile) {
      const { data, error } = await supabaseAdmin
        .from('property_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Update Redis cache
      try {
        await cachePropertyCategories(data)
      } catch (redisError) {
        console.error('Redis cache update error:', redisError)
        // Continue even if Redis fails
      }

      return NextResponse.json({ 
        data,
        message: 'Data reconciled and cached successfully'
      })
    }

    // Try to get from Redis first
    try {
      const cachedData = await getCachedPropertyCategories()
      if (cachedData) {
        return NextResponse.json({ data: cachedData, cached: true })
      }
    } catch (redisError) {
      console.error('Redis fetch error:', redisError)
      // Fall through to database fetch
    }

    // Fallback to database if cache miss
    const data = await getCachedPropertyCategoriesFromDB()
    
    // Cache the data for future requests
    try {
      await cachePropertyCategories(data)
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }
    
    return NextResponse.json({ data, cached: false })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    // Invalidate cache after successful creation
    invalidatePropertyCategoriesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_categories')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyCategories(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
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

    // Invalidate cache after successful update
    invalidatePropertyCategoriesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_categories')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyCategories(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
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

    // Invalidate cache after successful deletion
    invalidatePropertyCategoriesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_categories')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyCategories(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ message: 'Property category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
